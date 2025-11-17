
export enum AgentStatus {
  IDLE = 'Idle',
  RETRIEVING_DATA = 'Data Retriever Agent: Processing Document',
  GENERATING_REPORT = 'Medical Facilitator Agent: Analyzing and Generating Report',
  SAVING_REPORT = 'Saving Report to GCS Bucket',
  DONE = 'Done',
}

export interface UploadedFile {
  base64: string;
  mimeType: string;
  name: string;
}
