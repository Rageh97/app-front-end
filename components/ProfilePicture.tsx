import React, { FunctionComponent } from "react";
import ProfilePicturePlaceholder from "@/components/icons/ProfilePicturePlaceholder";
import Image from "next/image";
import { cn } from "@/utils/cn";

type Props = {
  profilePicture?: string;
  className?: string;
  width?: number;
  height?: number;
};

const ProfilePicture: FunctionComponent<Props> = ({
  profilePicture,
  className,
  width = 64,
  height = 64,
}) => {
  return profilePicture ? (
    <Image
      width={width}
      height={height}
      src={profilePicture}
      className={cn(
        `object-cover object-center rounded-full w-${width / 4} h-${height / 4}`,
        className
      )}
      alt={"Profile picture"}
    />
  ) : (
    <ProfilePicturePlaceholder width={width} height={height} />
  );
};

export default ProfilePicture;
