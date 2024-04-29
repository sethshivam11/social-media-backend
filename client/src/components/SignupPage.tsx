import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import bgDoodle from "/bg-doodle-2.jpg";
import bgDarkDoodle from "/bg-doodle-white.jpg";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import CheckboxWithLabel from "./CheckboxWithLabel";

interface FormInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

function SignupPage() {
  const { handleSubmit, register } = useForm<FormInput>();
  const [showPwd, setShowPwd] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [username, setUsername] = React.useState("");
  // const [isCheckingUsername, setIsCheckingUsername] = React.useState(false);
  const [confirmPwd, setConfirmPwd] = React.useState("");
  // const [avatar, setAvatar] = React.useState<File | null>(null);
  const [usernameMessage, setUsernameMessage] = React.useState("");
  const debounced = useDebounceCallback(setUsername, 500);

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    console.log(data);
    username;
    setIsLoading(false);
    setUsernameMessage("")
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
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-zinc-900 ring-2 ring-zinc-500 dark:ring-zinc-200 rounded-lg shadow-md z-10">
        <div className="text-center  text-black dark:text-white">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Join Sociial
          </h1>
          <p className="mb-4">Sign up to start to your journey with us</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="fullName">Name</Label>
            <Input
              {...register("fullName")}
              type="text"
              id="fullName"
              placeholder="Name"
              autoComplete="name"
              inputMode="text"
            />
          </div>
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
            <Label htmlFor="username">Username</Label>
            <Input
              {...register("username")}
              type="text"
              id="username"
              placeholder="Username"
              autoComplete="username"
              inputMode="text"
              onChange={(e) => debounced(e.target.value)}
            />
          </div>
          {usernameMessage ?? ""}
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              {...register("password")}
              type={showPwd ? "text" : "password"}
              id="passwod"
              placeholder="Password"
              autoComplete="new-password"
              inputMode="text"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="password">Confirm Password</Label>
            <Input
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              type={showPwd ? "text" : "password"}
              id="password"
              placeholder="Confirm Password"
              autoComplete="current-password webauthn"
              inputMode="text"
            />
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="avatar">Profile Picture</Label>
            <Input
              // onChange={(e) => setAvatar(e.target.files[0])}
              type="file"
              id="avatar"
              accept="image/jpeg image/png image/jpg"
              placeholder="Profile Picture"
            />
          </div>

          <CheckboxWithLabel
            text="Show Password"
            checked={showPwd}
            setChecked={setShowPwd}
          />
          <div className="flex items-center justify-start gap-2">
            <Button color="primary" size="lg" type="submit">
              {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
            </Button>
            <Link to="/sign-in">
              <Button
                color="primary"
                size="lg"
                variant="outline"
                className="dark:text-white"
                type="button"
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

export default SignupPage;
