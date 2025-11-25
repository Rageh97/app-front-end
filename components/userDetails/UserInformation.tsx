"use client";

import React, { FunctionComponent } from "react";
import Loader from "@/components/common/Loader";
import DetailCell from "@/components/DetailCell";
import ProfilePicture from "@/components/ProfilePicture";
import { mappingGender } from "@/utils/gender";
import dayjs from "dayjs";
import "dayjs/locale/en";
import IconButton from "@/components/buttons/IconButton";
import CameraIcon from "@/components/svg/CameraIcon";
import { useModal } from "@/components/providers/ModalProvider";
import { useGetUser } from "@/utils/users/getUser";
import { fullDateTimeFormat } from "@/utils/timeFormatting";

type Props = {
  data: any;
  isLoading: boolean;
  isError: boolean
};

const UserInformation: FunctionComponent<Props> = ({ data, isLoading, isError }) => {

  if (isLoading) return <Loader />;
  if (isError)
    return <div className="text-red">We failed to load user data.</div>;
  if (data) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailCell
          ignoreIfEmpty={true}
          label={"Full Name"}
          value={`${data.first_name} ${data.last_name}` || "none"}
        />
        <DetailCell
          ignoreIfEmpty={true}
          label={"Email Address"}
          type={"email"}
          value={data.email || "none"}
        />
       <DetailCell
          ignoreIfEmpty={true}
          label={"Role"}
          value={
            (
              <div
                style={{
                  backgroundColor:
                    data.role === "admin" ? "orange" :
                    data.role === "manager" ? "#008000" :
                    data.role === "supervisor" ? "#800080" :
                    data.role === "employee" ? "#FF4500" :
                    "#0000ff", // Default blue for client
                }}
                className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
              >
                {data.role === "admin" ? "Admin" : 
                 data.role === "manager" ? "Manager" : 
                 data.role === "supervisor" ? "Supervisor" : 
                 data.role === "employee" ? "Employee" : "Client"}
              </div>
            ) || "none"
          }
        />
      
        <DetailCell
          ignoreIfEmpty={true}
          label={"Is Account Active"}
          value={
            (
              <div
                style={{
                  backgroundColor:
                    data.isActive === true
                      ? "green"
                      : data.isActive === false && "#A020F0",
                }}
                className="px-2 py-1 w-min rounded-lg text-white text-xs text-center"
              >
                {data.isActive === true ? "Active" : "Inactive"}
              </div>
            ) || "none"
          }
        />
        <DetailCell
          ignoreIfEmpty={true}
          label={"Joined At"}
          value={data.createdAt ? fullDateTimeFormat(data.createdAt) : "none"}
        />
      </div>
    );
  }
};

export default UserInformation;
