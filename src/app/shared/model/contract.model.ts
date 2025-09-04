import { Package } from "./package.model";
import { User } from "./user";

export interface Contract {
  id: string;
  value: number;
  mode: string;
  payday: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  user: User;
  package: Package;
}