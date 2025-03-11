import { readdirSync } from 'fs';
import { join } from 'path';

const jobsPath = join(__dirname, 'jobs');
const jobFiles = readdirSync(jobsPath);

jobFiles.forEach(file => {
  import(join(jobsPath, file));
});
