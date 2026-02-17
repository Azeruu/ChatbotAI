"use client";

import { useState } from "react";
import Logo from "../assets/opensawit.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type User = {
  id: string;
  name: string;
};

type LoginPageProps = {
  apiBaseUrl: string;
  onLogin: (user: User) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function LoginPage({ apiBaseUrl, onLogin, open, onOpenChange }: LoginPageProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Nama tidak boleh kosong");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        setError("Gagal login, coba lagi");
        return;
      }

      const data = await response.json();
      if (data?.id && data?.name) {
        onLogin({
          id: data.id as string,
          name: data.name as string,
        });
      } else {
        setError("Response login tidak valid");
      }
    } catch (submitError) {
      console.error("Gagal login", submitError);
      setError("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-amber-400/80 via-gray-400/90 to-amber-400/80">
        <DialogHeader className="flex justify-center items-center">
          <img src={Logo} alt="Logo Opensawit" className="w-16 h-16 mx-auto" />
          <DialogTitle>Login</DialogTitle>
          <DialogDescription className="text-gray-700">
            Masuk dulu supaya percakapanmu tersimpan.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <Field>
            <Label htmlFor="name">Nama panggilan</Label>
            <FieldGroup>
              <Input
                className="text-gray-700"
                id="name"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: wowo, bambang, dll"
                disabled={loading}
              />
            </FieldGroup>
          </Field>
          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg py-2 font-medium transition-colors"
            >
              {loading ? "Masuk..." : "Masuk dan mulai chat"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export type { LoginPageProps, User };
export { LoginPage };

