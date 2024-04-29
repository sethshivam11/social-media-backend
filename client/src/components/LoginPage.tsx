import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import bgDoodle from "/bg-doodle-2.jpg";
import bgDarkDoodle from "/bg-doodle-white.jpg";
import { Label } from "./ui/label";
import CheckboxWithLabel from "./CheckboxWithLabel";

interface FormInput {
  email: string;
  password: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const { handleSubmit, register } = useForm<FormInput>();
  const [showPwd, setShowPwd] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    setIsLoading(true);
    let username = "";
    if (!(data.email.includes("@") || data.email.includes("."))) {
      username = data.email;
      data.email = "";
    }
    console.log("Loading");
    await fetch("/api/v1/users/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        email: data.email,
        password: data.password,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((parsed) => parsed.json())
      .then((jsonData) => {
        console.log(jsonData);
        if (jsonData.success) {
          navigate("/");
        }
      })
      .catch((err) => {
        console.log(err);
        toast.error(err?.message || "Something went wrong!");
      })
      .finally(() => setIsLoading(false));
  };
  return (
    <div className="flex justify-center items-center min-h-screen bg-zinc-800">
      <img
        src={bgDoodle}
        alt=""
        className="absolute object-cover h-full w-full blur-sm hidden dark:block"
      />
      <img
        src={bgDarkDoodle}
        alt=""
        className="absolute object-cover h-full w-full blur-sm dark:hidden"
      />
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-zinc-900 ring-2 ring-zinc-500 dark:ring-zinc-200 rounded-lg shadow-md relative z-10">
        <div className="text-center text-black dark:text-white">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Welcome Back to Sociial
          </h1>
          <p className="mb-4">Sign in to continue to your journey with us</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              {...register("email")}
              type="email"
              id="email"
              placeholder="Email"
              autoComplete="email"
              inputMode="email"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              {...register("password")}
              type={showPwd ? "text" : "password"}
              id="password"
              placeholder="Password"
              autoComplete="current-password"
              inputMode="text"
            />
          </div>
          
          <CheckboxWithLabel text="Show Password" checked={showPwd} setChecked={setShowPwd} /> 
          <div className="flex items-center justify-start gap-2">
            <Button color="primary" size="lg" type="submit">
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
            </Button>
            <Link to="/sign-up">
              <Button
                color="primary"
                size="lg"
                className="dark:text-white"
                type="button"
                variant="outline"
                disabled={isLoading}
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
