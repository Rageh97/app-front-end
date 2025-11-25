import { NewClientsRequest } from "../clients/new-clients-request";

export type ClientsResDto = NewClientsRequest & {
  id: number;
  profile_picture: string;
};
