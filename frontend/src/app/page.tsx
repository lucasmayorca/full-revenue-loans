import { redirect } from "next/navigation";

// Root redirects to the offers screen
export default function Home() {
  redirect("/offers");
}
