export class SecurityLayer {
  private dangerousPatterns: Record<string, RegExp[]> = {
    python: [
      /import\s+os/,
      /import\s+subprocess/,
      /import\s+sys/,
      /eval\s*\(/,
      /exec\s*\(/,
      /__import__\s*\(/,
      /open\s*\(/,
      // input() removed - it's safe and commonly used for reading stdin
    ],
    javascript: [
      /require\s*\(\s*['"]child_process['"]\s*\)/,
      /require\s*\(\s*['"]fs['"]\s*\)/,
      /require\s*\(\s*['"]net['"]\s*\)/,
      /eval\s*\(/,
      /Function\s*\(/,
      /process\.exit/,
    ],
    cpp: [
      /#include\s*<fstream>/,
      /#include\s*<cstdlib>/,
      /system\s*\(/,
      /exec[vl]p?\s*\(/,
      /popen\s*\(/,
    ],
    java: [
      /Runtime\.getRuntime\(\)/,
      /ProcessBuilder/,
      /System\.exit/,
      /FileInputStream/,
      /FileOutputStream/,
    ],
  };

  private suspiciousPatterns: RegExp[] = [
    /while\s*\(\s*true\s*\)/i, // Infinite loops
    /for\s*\(\s*;\s*;\s*\)/i, // Infinite loops
    /fork\s*\(/,
    /pthread_create/,
    /malloc\s*\(\s*\d{7,}\s*\)/, // Large allocations
  ];

  public async validateCode(code: string, language: string): Promise<{
    safe: boolean;
    violations: string[];
    warnings: string[];
  }> {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check code size
    if (code.length > 100 * 1024) {
      violations.push('Code size exceeds 100KB limit');
    }

    // Check for dangerous patterns
    const patterns = this.dangerousPatterns[language] || [];
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        violations.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    // Check for suspicious patterns
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(code)) {
        warnings.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }

    // Check for excessive line count
    const lineCount = code.split('\n').length;
    if (lineCount > 1000) {
      warnings.push('Code has more than 1000 lines');
    }

    return {
      safe: violations.length === 0,
      violations,
      warnings,
    };
  }

  public sanitizeOutput(output: string, maxLength: number = 1024 * 10): string {
    if (output.length > maxLength) {
      return output.substring(0, maxLength) + '\n... (output truncated)';
    }
    return output;
  }
}
