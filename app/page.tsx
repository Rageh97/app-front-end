import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Nexus Toolz",
  description: "Your gateway to powerful and innovative digital tools with unmatched reliability!",
  // other metadata
};

export default function Home() {
  redirect("/signin");
}