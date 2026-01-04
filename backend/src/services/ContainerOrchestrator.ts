import Docker from 'dockerode';
import { nanoid } from 'nanoid';
import { Logger } from 'pino';
import { SUPPORTED_LANGUAGES, CONTAINER_CONFIG, EXECUTION_LIMITS } from '../config/constants';
import { SecurityLayer } from './SecurityLayer';
import tar from 'tar-stream';
import { Readable } from 'stream';
import { logger } from '../utils/logger';

export interface ExecutionRequest {
  code: string;
  language: string;
  stdin?: string;
  timeout?: number;
  memoryLimit?: number;
}

export interface ExecutionResult {
  executionId: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
  memoryUsed: number;
  compilationOutput?: string;
  error?: string;
  securityViolations?: string[];
}

export class ContainerOrchestrator {
  private static instance: ContainerOrchestrator;
  private docker: Docker;
  private containerPools: Map<string, string[]> = new Map();
  private activeContainers: Set<string> = new Set();
  private logger: Logger;
  private securityLayer: SecurityLayer;
  private stats = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    avgExecutionTime: 0,
    securityViolations: 0,
  };

  private constructor() {
    this.docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock',
    });
    this.securityLayer = new SecurityLayer();
    this.logger = logger;
  }

  public static getInstance(): ContainerOrchestrator {
    if (!ContainerOrchestrator.instance) {
      ContainerOrchestrator.instance = new ContainerOrchestrator();
    }
    return ContainerOrchestrator.instance;
  }

  public async initialize(): Promise<void> {
    this.logger.info('Initializing container orchestrator...');
    
    try {
      // Check Docker availability
      await this.docker.ping();
      
      // Build base images if they don't exist
      await this.ensureImagesExist();
      
      // Pre-warm container pools
      await this.prewarmContainers();
    } catch (error: any) {
      if (error.code === 'EACCES' || error.message?.includes('permission denied')) {
        this.logger.error('❌ Docker permission denied. Run: sudo usermod -aG docker $USER && newgrp docker');
      } else if (error.code === 'ENOENT' || error.message?.includes('ENOENT')) {
        this.logger.error('❌ Docker daemon not running. Start it with: sudo systemctl start docker');
      } else {
        this.logger.error('❌ Failed to connect to Docker:', error.message);
      }
      throw error;
    }
  }

  private async ensureImagesExist(): Promise<void> {
    const languages = Object.values(SUPPORTED_LANGUAGES);
    
    for (const lang of languages) {
      try {
        await this.docker.getImage(lang.image).inspect();
        this.logger.info(`✓ Image ${lang.image} exists`);
      } catch (error) {
        this.logger.warn(`⚠ Image ${lang.image} not found, will be built on demand`);
      }
    }
  }

  private async prewarmContainers(): Promise<void> {
    const poolSize = parseInt(process.env.PREWARM_POOL_SIZE || '2', 10);
    
    // Skip prewarming if disabled or Docker not available
    if (poolSize === 0) {
      this.logger.info('Container pre-warming is disabled (PREWARM_POOL_SIZE=0)');
      return;
    }
    
    const languages = ['python', 'javascript', 'cpp']; // Pre-warm most common languages
    this.logger.info(`Pre-warming ${poolSize} containers per language...`);
    
    const prewarmPromises = languages.map(async (langId) => {
      this.containerPools.set(langId, []);
      
      // Check if image exists before attempting to pre-warm
      const language = SUPPORTED_LANGUAGES[langId as keyof typeof SUPPORTED_LANGUAGES];
      try {
        await this.docker.getImage(language.image).inspect();
      } catch (error) {
        this.logger.warn(`Skipping pre-warm for ${langId}: image not found`);
        return;
      }
      
      // Create containers in parallel for faster pre-warming
      const containerPromises = Array(poolSize).fill(null).map(async () => {
        try {
          const containerId = await this.createContainer(langId);
          return containerId;
        } catch (error) {
          return null;
        }
      });
      
      const containers = await Promise.all(containerPromises);
      const successfulContainers = containers.filter(id => id !== null) as string[];
      
      if (successfulContainers.length > 0) {
        this.containerPools.set(langId, successfulContainers);
        this.logger.info(`✓ Pre-warmed ${successfulContainers.length}/${poolSize} containers for ${langId}`);
      }
    });
    
    await Promise.all(prewarmPromises);
    this.logger.info('✅ Container pre-warming complete');
  }

  private async createContainer(languageId: string): Promise<string> {
    const language = SUPPORTED_LANGUAGES[languageId as keyof typeof SUPPORTED_LANGUAGES];
    if (!language) {
      throw new Error(`Unsupported language: ${languageId}`);
    }

    const containerName = `lightexec-${languageId}-${nanoid(8)}`;
    
    const container = await this.docker.createContainer({
      name: containerName,
      Image: language.image,
      Cmd: ['/bin/sh', '-c', 'while true; do sleep 1; done'], // Keep alive for pool
      WorkingDir: '/workspace',
      HostConfig: {
        Memory: (language.memory || 128) * 1024 * 1024,
        MemorySwap: (language.memory || 128) * 1024 * 1024, // No swap
        NanoCpus: EXECUTION_LIMITS.maxCpuCores * 1e9,
        NetworkMode: CONTAINER_CONFIG.networkMode,
        ReadonlyRootfs: CONTAINER_CONFIG.readOnly,
        CapDrop: CONTAINER_CONFIG.capDrop,
        SecurityOpt: CONTAINER_CONFIG.securityOpt,
        PidsLimit: languageId === 'java' ? 256 : CONTAINER_CONFIG.pidsLimit, // Java needs more threads
        Ulimits: [
          { Name: 'nofile', Soft: 256, Hard: 256 },
          { Name: 'nproc', Soft: languageId === 'java' ? 256 : 64, Hard: languageId === 'java' ? 256 : 64 }, // Java needs more processes
        ],
      },
      Labels: {
        'lightexec.managed': 'true',
        'lightexec.language': languageId,
        'lightexec.pool': 'true',
      },
    });

    await container.start();
    return container.id;
  }

  public async executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
    const executionId = nanoid();
    const startTime = Date.now();
    
    this.logger.info(`[${executionId}] Starting execution for ${request.language}`);
    this.logger.debug(`[${executionId}] Method entry`);
    this.stats.totalExecutions++;

    try {
      // Parallelize security checks and container acquisition
      const [securityCheck, containerId] = await Promise.all([
        this.securityLayer.validateCode(request.code, request.language),
        this.getContainer(request.language)
      ]);
      
      if (!securityCheck.safe) {
        this.stats.securityViolations++;
        // Return container to pool immediately
        await this.cleanupContainer(containerId, request.language);
        throw new Error(`Security violation: ${securityCheck.violations.join(', ')}`);
      }

      this.activeContainers.add(containerId);

      try {
        // Copy code to container
        await this.copyCodeToContainer(containerId, request.code, request.language);

        // Execute code
        const result = await this.runInContainer(
          containerId,
          request.language,
          request.stdin,
          request.timeout || EXECUTION_LIMITS.defaultTimeout
        );

        const executionTime = Date.now() - startTime;
        this.updateAverageExecutionTime(executionTime);
        this.stats.successfulExecutions++;

        this.logger.info(`[${executionId}] Execution completed in ${executionTime}ms`);
        this.logger.debug(`[${executionId}] About to return result`);

        return {
          executionId,
          ...result,
          executionTime,
          securityViolations: securityCheck.warnings,
        };
      } finally {
        this.logger.debug(`[${executionId}] Entering finally block for cleanup`);
        // Cleanup container asynchronously (non-blocking)
        this.activeContainers.delete(containerId);
        this.cleanupContainer(containerId, request.language).catch(err => 
          this.logger.error(`Background cleanup failed for ${containerId}:`, err)
        );
        this.logger.debug(`[${executionId}] Cleanup initiated`);
      }
    } catch (error: any) {
      this.stats.failedExecutions++;
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`[${executionId}] Execution failed:`, error);

      return {
        executionId,
        stdout: '',
        stderr: error.message || 'Unknown error',
        exitCode: -1,
        executionTime,
        memoryUsed: 0,
        error: error.message,
      };
    }
  }

  private async getContainer(languageId: string): Promise<string> {
    const pool = this.containerPools.get(languageId);
    
    if (pool && pool.length > 0) {
      const containerId = pool.pop()!;
      this.logger.debug(`Using pooled container ${containerId} for ${languageId}, ${pool.length} remaining in pool`);
      
      // Ensure container is running
      try {
        const container = this.docker.getContainer(containerId);
        const info = await container.inspect();
        if (!info.State.Running) {
          this.logger.debug(`Starting pooled container ${containerId}`);
          await container.start();
        }
        return containerId;
      } catch (error) {
        this.logger.warn(`Pooled container ${containerId} is invalid, creating new one`);
        return await this.createContainer(languageId);
      }
    }

    this.logger.warn(`No pooled containers available for ${languageId} (pool has ${pool?.length || 0}), creating new one`);
    return await this.createContainer(languageId);
  }

  private async copyCodeToContainer(containerId: string, code: string, languageId: string): Promise<void> {
    const language = SUPPORTED_LANGUAGES[languageId as keyof typeof SUPPORTED_LANGUAGES];
    const extension = language.extensions[0];
    // Java requires capitalized Main to match public class Main
    const filename = languageId === 'java' ? `Main${extension}` : `main${extension}`;

    const pack = tar.pack();
    pack.entry({ name: filename }, code);
    pack.finalize();

    const container = this.docker.getContainer(containerId);
    await container.putArchive(pack, { path: '/workspace' });
  }

  private async runInContainer(
    containerId: string,
    languageId: string,
    stdin?: string,
    timeout?: number
  ): Promise<Omit<ExecutionResult, 'executionId' | 'executionTime'>> {
    const language = SUPPORTED_LANGUAGES[languageId as keyof typeof SUPPORTED_LANGUAGES];
    const extension = language.extensions[0];
    // Java requires capitalized Main to match public class Main
    const filename = languageId === 'java' ? `Main${extension}` : `main${extension}`;
    
    let command: string[];
    let compilationOutput = '';

    // Compilation step for compiled languages
    if (language.compile) {
      const compileResult = await this.compileCode(containerId, languageId, filename);
      compilationOutput = compileResult.output;
      
      if (compileResult.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compilationOutput,
          exitCode: compileResult.exitCode,
          memoryUsed: 0,
          compilationOutput,
          error: 'Compilation failed',
        };
      }
    }

    // Execution command
    command = this.getExecutionCommand(languageId, filename);

    const container = this.docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: !!stdin,
      Tty: false,
    });

    const stream = await exec.start({ 
      Detach: false, 
      Tty: false,
      hijack: true,
      stdin: true
    });
    
    // Write stdin data if provided
    if (stdin) {
      try {
        stream.write(stdin + '\n');
        stream.end();
      } catch (e) {
        this.logger.warn('Failed to write stdin:', e);
      }
    }
    
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        timedOut = true;
        stream.destroy();
        resolve();
      }, timeout || EXECUTION_LIMITS.defaultTimeout);
    });

    const outputPromise = new Promise<void>((resolve) => {
      const chunks: Buffer[] = [];
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        
        // Enforce output size limit
        const totalSize = chunks.reduce((sum, c) => sum + c.length, 0);
        if (totalSize > EXECUTION_LIMITS.maxOutputSize) {
          stream.destroy();
          stderr = 'Output size limit exceeded';
          resolve();
        }
      });

      stream.on('end', () => {
        const output = Buffer.concat(chunks).toString('utf8');
        const parsed = this.parseDockerOutput(output);
        stdout = parsed.stdout;
        stderr = parsed.stderr;
        resolve();
      });

      stream.on('error', () => {
        resolve();
      });
    });

    await Promise.race([outputPromise, timeoutPromise]);

    const inspectResult = await exec.inspect();
    const exitCode = timedOut ? 124 : (inspectResult.ExitCode || 0);

    // Improve timeout error message
    let timeoutMessage = 'Execution timed out';
    if (timedOut && !stdin && /input\s*\(/.test(code)) {
      timeoutMessage = 'Execution timed out - Your code uses input() but no stdin was provided. Please provide input data.';
    }

    // Skip memory stats collection for faster execution
    // Can be re-enabled if needed by uncommenting below:
    // const stats = await container.stats({ stream: false });
    // const memoryUsed = stats.memory_stats.usage || 0;

    return {
      stdout: stdout.substring(0, EXECUTION_LIMITS.maxOutputSize),
      stderr: timedOut ? timeoutMessage : stderr.substring(0, EXECUTION_LIMITS.maxOutputSize),
      exitCode,
      memoryUsed: 0, // Disabled for performance
      compilationOutput,
    };
  }

  private async compileCode(containerId: string, languageId: string, filename: string): Promise<{ exitCode: number; output: string }> {
    const compileCommands: Record<string, string[]> = {
      cpp: ['/bin/sh', '-c', `cd /workspace && TMPDIR=/tmp g++ -std=c++17 -O2 -fPIE -fstack-protector-strong -o main "${filename}"`],
      c: ['/bin/sh', '-c', `cd /workspace && TMPDIR=/tmp gcc -std=c11 -O2 -fPIE -fstack-protector-strong -o main "${filename}"`],
      java: ['/bin/sh', '-c', `cd /workspace && javac -J-Xms32m -J-Xmx128m "${filename}"`], // Limit compiler memory for faster startup
      rust: ['rustc', '-O', '-o', 'main', filename],
      go: ['go', 'build', '-o', 'main', filename],
      typescript: ['npx', 'tsc', '--outDir', '.', filename],
    };

    const command = compileCommands[languageId];
    if (!command) return { exitCode: 0, output: '' };

    const container = this.docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: command,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: '/workspace',
    });

    const stream = await exec.start({ Detach: false });
    const chunks: Buffer[] = [];

    return new Promise((resolve) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', async () => {
        const output = Buffer.concat(chunks).toString('utf8');
        const inspectResult = await exec.inspect();
        const parsed = this.parseDockerOutput(output);
        // Combine stdout and stderr for compilation output
        const combinedOutput = (parsed.stdout + '\n' + parsed.stderr).trim();
        resolve({
          exitCode: inspectResult.ExitCode || 0,
          output: combinedOutput || output,
        });
      });
    });
  }

  private getExecutionCommand(languageId: string, filename: string): string[] {
    const commands: Record<string, string[]> = {
      python: ['python3', filename],
      javascript: ['node', filename],
      typescript: ['node', filename.replace('.ts', '.js')],
      cpp: ['./main'],
      c: ['./main'],
      java: ['java', '-XX:+UseSerialGC', '-XX:TieredStopAtLevel=1', '-Xms32m', '-Xmx256m', '-Xss512k', 'Main'],  // Fast startup flags
      rust: ['./main'],
      go: ['./main'],
      ruby: ['ruby', filename],
      php: ['php', filename],
    };

    return ['timeout', '10', ...commands[languageId]];
  }

  private parseDockerOutput(output: string): { stdout: string; stderr: string } {
    // Docker multiplexes stdout/stderr with 8-byte headers
    let stdout = '';
    let stderr = '';
    const buffer = Buffer.from(output);
    let pos = 0;

    while (pos < buffer.length) {
      if (pos + 8 > buffer.length) break;

      const streamType = buffer[pos];
      const size = buffer.readUInt32BE(pos + 4);

      if (pos + 8 + size > buffer.length) break;

      const data = buffer.slice(pos + 8, pos + 8 + size).toString('utf8');

      if (streamType === 1) stdout += data;
      else if (streamType === 2) stderr += data;

      pos += 8 + size;
    }

    return { stdout, stderr };
  }

  private async cleanupContainer(containerId: string, languageId: string): Promise<void> {
    this.logger.debug(`Cleaning up container ${containerId} for ${languageId}`);
    try {
      const container = this.docker.getContainer(containerId);
      
      // Check if container should go back to pool
      const pool = this.containerPools.get(languageId);
      const poolSize = parseInt(process.env.PREWARM_POOL_SIZE || '2', 10);
      
      if (pool && pool.length < poolSize) {
        // Reset container and return to pool
        await this.resetContainer(containerId);
        pool.push(containerId);
        this.logger.debug(`Returned container ${containerId} to ${languageId} pool, now ${pool.length}/${poolSize}`);
      } else {
        this.logger.debug(`Pool full for ${languageId} (${pool?.length}/${poolSize}), removing container ${containerId}`);
        // Remove container
        await container.stop();
        await container.remove();
        this.logger.debug(`Removed container ${containerId}`);
      }
    } catch (error) {
      this.logger.error(`Error cleaning up container ${containerId}:`, error);
    }
  }

  private async resetContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      
      // Clean workspace - fire and forget for speed
      const exec = await container.exec({
        Cmd: ['sh', '-c', 'rm -rf /workspace/* /tmp/*'],
        AttachStdout: false,
        AttachStderr: false,
      });
      
      // Don't wait for cleanup to complete
      exec.start({ Detach: true }).catch(() => {});
      this.logger.debug(`Reset container ${containerId}`);
    } catch (error) {
      this.logger.error(`Error resetting container ${containerId}:`, error);
      // Don't throw - allow container to be reused anyway
    }
  }

  private updateAverageExecutionTime(executionTime: number): void {
    const total = this.stats.totalExecutions;
    this.stats.avgExecutionTime = 
      ((this.stats.avgExecutionTime * (total - 1)) + executionTime) / total;
  }

  public getStats() {
    return {
      ...this.stats,
      activeContainers: this.activeContainers.size,
      pooledContainers: Array.from(this.containerPools.values())
        .reduce((sum, pool) => sum + pool.length, 0),
    };
  }

  public async cleanup(): Promise<void> {
    this.logger.info('Cleaning up containers...');

    // Stop all active executions
    for (const containerId of this.activeContainers) {
      try {
        const container = this.docker.getContainer(containerId);
        await container.stop();
        await container.remove();
      } catch (error) {
        this.logger.error(`Error stopping container ${containerId}:`, error);
      }
    }

    // Clean up pools
    for (const [langId, pool] of this.containerPools) {
      for (const containerId of pool) {
        try {
          const container = this.docker.getContainer(containerId);
          await container.stop();
          await container.remove();
        } catch (error) {
          this.logger.error(`Error cleaning up pooled container ${containerId}:`, error);
        }
      }
    }

    this.logger.info('Cleanup complete');
  }
}

// Helper function for direct code execution
export async function executeCode(request: ExecutionRequest): Promise<ExecutionResult> {
  const orchestrator = ContainerOrchestrator.getInstance();
  return orchestrator.executeCode(request);
}
