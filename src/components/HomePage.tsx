import { useState } from "react";
import { Button } from "../components/ui/button";
import Logo from "../assets/opensawit.png";
import { LoginPage, type User } from "./LoginPage";

type HomePageProps = {
  // onGetStarted: () => void;
  onLogin: (user: User) => void;
  // apiBaseUrl: string;
};


function HomePage({ onLogin }: HomePageProps) {
  const [openLogin, setOpenLogin] = useState(false);
  return (
    <div className="relative fixed bg-[url('/kebunsawit.png')] min-h-screen bg-cover bg-center bg-no-repeat">
      {/* <img src={BG} alt="" /> */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-amber-400/70 text-gray-800 pb-6">
        <div className="w-full max-w-xl text-center space-y-6 flex flex-col items-center justify-center p-8">
          <img src={Logo} className="mt-5 w-100 h-100" alt="" />
          <p className="text-base -mt-20 text-gray-800 leading-relaxed">
            Chat bareng Wowo Chan, temen tongkrongan virtual yang siap
            dicurhatin, diajak diskusi, atau sekadar dijadiin bahan roasting
            santai.
          </p>
          <Button
            onClick={() => setOpenLogin(true)}
            className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white rounded-xl px-8 py-3 font-medium shadow-md transition-colors"
          >
            Mulai Chat Sekarang
          </Button>

          <LoginPage
            open={openLogin}
            onOpenChange={setOpenLogin}
            apiBaseUrl="http://localhost:3000"
            onLogin={(user) => {
              onLogin(user);
              console.log("Berhasil login:", user);
              setOpenLogin(false);
            }}
          />

        </div>
      </div>
    </div>
  );
}

export type { HomePageProps };
export { HomePage };
