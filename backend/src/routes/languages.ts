import { Router, Request, Response } from 'express';
import { SUPPORTED_LANGUAGES } from '../config/constants';

export const router = Router();

router.get('/', (req: Request, res: Response) => {
  const languages = Object.values(SUPPORTED_LANGUAGES).map(lang => ({
    id: lang.id,
    name: lang.name,
    version: lang.version,
    extensions: lang.extensions,
    supportsCompilation: lang.compile,
    defaultTimeout: lang.timeout,
    defaultMemory: lang.memory,
  }));

  res.json({ languages });
});

router.get('/:id', (req: Request, res: Response) => {
  const language = SUPPORTED_LANGUAGES[req.params.id as keyof typeof SUPPORTED_LANGUAGES];
  
  if (!language) {
    return res.status(404).json({ error: 'Language not found' });
  }

  res.json({
    id: language.id,
    name: language.name,
    version: language.version,
    extensions: language.extensions,
    supportsCompilation: language.compile,
    defaultTimeout: language.timeout,
    defaultMemory: language.memory,
  });
});

export default router;
