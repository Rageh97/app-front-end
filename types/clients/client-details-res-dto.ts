import { NewClientsRequest } from "@/types/clients/new-clients-request";

export type ClientDetailsResDto = NewClientsRequest & {
  id: number;
  first_name: string;
  profile_picture: string;
  identity: boolean;
  sender: number;
};
