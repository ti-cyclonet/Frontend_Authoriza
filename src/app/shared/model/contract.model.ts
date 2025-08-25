export interface Contract {
  id: string;
  value: string;
  mode: string;
  payday: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: {
    id: string;
    strUserName: string;
  };
  package: {
    id: string;
    name: string;
    description: string;
  };
}