import { SafeUrl } from "@angular/platform-browser";

export interface FileUpload {
  file: any;
  urlSanatizer: SafeUrl;
  fileName: string;
  id: number;
  isSignatory: boolean;
  signatureRequestLzId: string;
  documentType?: string;
  isManualDocument?:boolean;
}