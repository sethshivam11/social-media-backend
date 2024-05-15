import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import bgDoodle from "/bg-doodle-2.jpg";
import bgDarkDoodle from "/bg-doodle-white.jpg";
import { useDebounceCallback } from "usehooks-ts";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import CheckboxWithLabel from "./CheckboxWithLabel";
import { useUser } from "@/context/UserProvider";

interface FormInput {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

function SignupPage() {
  const form = useForm<FormInput>({
    defaultValues: {
      email: "",
      fullName: "",
      username: "",
      password: "",
    },
  });
  const { getValues } = form;
  const { loading, registerUser } = useUser();
  const [showPwd, setShowPwd] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [passwordsMatchMessage, setPasswordsMatchMessage] = React.useState("");
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [avatar, setAvatar] = React.useState<FileList | null>(null);
  const debounced = useDebounceCallback(setUsername, 500);
  const [isFetchingUsername, setIsFetchingUsername] = React.useState(false);
  const [usernameMessage, setUsernameMessage] = React.useState("");

  const onSubmit: SubmitHandler<FormInput> = async ({
    fullName,
    email,
    username,
    password,
  }) => {
    if (password !== confirmPwd) {
      return console.log("Passwords do not match");
    }
    await registerUser({
      email,
      fullName,
      username,
      password,
      avatar: avatar ? avatar[0] : null,
    });
  };

  function isUsernameAvailable(username: string) {
    if (!username?.trim()) {
      return;
    }
    setIsFetchingUsername(true);
    fetch(`/api/v1/users/usernameAvailable/${username}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        setUsernameMessage(response.message);
      })
      .catch((err) => {
        console.error(err);
        setUsernameMessage(err.message || "Error checking username");
      })
      .finally(() => setIsFetchingUsername(false));
  }

  React.useEffect(() => {
    if (username.startsWith(".")) {
      setUsernameMessage("Username cannot start with .");
    } else if (username && /^[a-z]._+$/.test(username)) {
      setUsernameMessage("Username must contain only lowercase, ., _");
    } else if (username.trim()) {
      isUsernameAvailable(username);
    } else {
      setUsernameMessage("");
    }
  }, [username]);

  React.useEffect(() => {
    if (confirmPwd !== getValues("password")) {
      return setPasswordsMatchMessage("Passwords do not match");
    }
    setPasswordsMatchMessage("");
  }, [confirmPwd]);

  return (
    <div className="flex justify-center items-center min-h-screen dark:bg-zinc-800">
      <img
        src={bgDoodle}
        alt=""
        className="absolute object-cover h-[60rem] w-full blur-sm hidden dark:block top-0"
      />
      <img
        src={bgDarkDoodle}
        alt=""
        className="absolute object-cover h-[60rem] w-full blur-sm dark:hidden top-0"
      />
      <div className="w-full max-w-md p-8 space-y-8 last:space-y-3 my-4 bg-white dark:bg-zinc-900 ring-2 ring-zinc-500 dark:ring-zinc-200 rounded-lg shadow-md z-10">
        <div className="text-center  text-black dark:text-white">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
            Join Sociial
          </h1>
          <p className="mb-4">Sign up to start to your journey with us</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="name"
                      inputMode="text"
                      placeholder="name"
                      autoFocus
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="username"
                      type="username"
                      max={30}
                      autoComplete="username"
                      inputMode="text"
                      required
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        debounced(e.target.value);
                      }}
                    />
                  </FormControl>
                  <span
                    className={`text-sm ${
                      usernameMessage === "Username available"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {!isFetchingUsername && usernameMessage}
                  </span>
                  {isFetchingUsername ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    ""
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="password"
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      inputMode="text"
                      required
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="confirmPassword"
              render={() => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="confirm password"
                      value={confirmPwd}
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password webauthn"
                      inputMode="text"
                      required
                      onChange={(e) => setConfirmPwd(e.target.value)}
                    />
                  </FormControl>
                  <span className="text-sm text-red-400">
                    {passwordsMatchMessage ?? ""}
                  </span>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="avatar"
              render={() => (
                <FormItem>
                  <FormLabel>Profile picture</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="profile pic"
                      type="file"
                      autoComplete="off"
                      onChange={(e) => setAvatar(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CheckboxWithLabel
              text="Show Password"
              checked={showPwd}
              setChecked={setShowPwd}
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Sign up"}
            </Button>
          </form>
        </Form>
        <p className="text-center mt-2">
          Already have an account?&nbsp;
          <Link to="/sign-in" className="text-blue-500 hover:opacity-80" type="button">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignupPage;
