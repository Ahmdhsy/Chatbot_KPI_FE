import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk | Chatbot KPI",
  description: "Halaman Masuk Chatbot KPI",
};

export default function SignIn() {
  return <SignInForm />;
}
