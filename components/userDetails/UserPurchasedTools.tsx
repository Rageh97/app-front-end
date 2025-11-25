"use client";

import React, { FunctionComponent, useEffect, useState } from "react";
import Loader from "@/components/common/Loader";
import DetailCell from "@/components/DetailCell";
import { useGetUsersPurchasedToolsList } from "@/utils/users/getUsersPurchasedTools";

type Props = {
  userId: number;
};

const UserPurchasedTools: FunctionComponent<Props> = ({ userId }) => {
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isError, refetch } = useGetUsersPurchasedToolsList(
    page,
    userId
  );

  useEffect(() => {
    refetch();
  }, [page]);

  if (isLoading) return <Loader />;

  if (isError) {
    return (
      <div className="text-red">We failed to load user's purchased tools</div>
    );
  }

  if (data) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <DetailCell
          ignoreIfEmpty={true}
          label={"Locatie"}
          value={data.location || "Niet gespecificeerd"}
        />
        <DetailCell
          ignoreIfEmpty={true}
          label={"Organisatie"}
          value={data.organisation || "Niet gespecificeerd"}
        />
        <DetailCell
          ignoreIfEmpty={true}
          label={"Afdeling"}
          value={data.departement || "Niet gespecificeerd"}
        />
      </div>
    );
  }
};

export default UserPurchasedTools;
