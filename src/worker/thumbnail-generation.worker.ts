import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('thumbnail-generation')
export class ThumbnailGenerationProcess extends WorkerHost {
  async process(job: Job, token?: string): Promise<any> {
    const { videoPath, videoId } = job.data;

    console.log(job.data);

    return 0;
  }
}
