import React from "react";
import { toast } from "./ui/use-toast";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface FormInput {
  identifier: string;
  password: string;
  code: string;
}

const ForgotPasswordPage = () => {
  const [isSendingMail, setIsSendingMail] = React.useState(false);
  const [timer, setTimer] = React.useState(0);
  const [confirmPwd, setConfirmPwd] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();
  const form = useForm<FormInput>({
    defaultValues: {
      identifier: "",
      password: "",
      code: "",
    },
  });

  function resendVerificationCode(username: string) {
    setIsSendingMail(true);
    fetch(`/api/v1/users/resendMail?username=${username}`)
      .then((parsed) => parsed.json())
      .then((response) => {
        if (response.success) {
          toast({
            title: "Success",
            description: response.message,
          });
          setTimer(30);
        } else {
          toast({
            title: "Error",
            description: response.message || "Something went wrong!",
            variant: "destructive",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        toast({
          title: "Error",
          description: err.message || "Something went wrong!",
          variant: "destructive",
        });
      })
      .finally(() => setIsSendingMail(false));
  }

  function onSubmit({ identifier, password, code }: FormInput) {
    const email =
      identifier.includes("@") && identifier.includes(".") ? identifier : "";
    if (!password) {
      return console.log("Passwords do not match");
    }
    setLoading(true);
    fetch("/api/v1/users/forgotPassword", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        username: identifier,
        password,
        code,
      }),
    })
      .then((parsed) => parsed.json())
      .then((data) => {
        if (data.success) {
          toast({
            title: "Success",
            description: data.message,
          });
          navigate("/sign-in");
        } else {
          toast({
            title: "Error",
            description: data.error,
            variant: "destructive",
          });
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => setLoading(false));
  }

  React.useEffect(() => {
    if (timer > 0) {
      const runningTimer = setInterval(() => {
        setTimer((timer) => (timer -= 1));
      }, 1000);
      return () => clearInterval(runningTimer);
    }
  }, [timer]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-2 flex items-center justify-center min-h-screen"
      >
        <Card className="w-fit space-y-2 ring-1 ring-gray-400 p-10">
          <CardHeader>
            <CardTitle className="text-4xl font-extrabold tracking-tight text-center lg:text-5xl mb-6">
              Forgot Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username or Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="username or email"
                      autoComplete="off"
                      inputMode="email"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-end justify-center w-full gap-2 my-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="verification code"
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                variant="secondary"
                type="button"
                disabled={
                  form.getValues("identifier").length === 0 ||
                  isSendingMail ||
                  timer > 0
                }
                onClick={() =>
                  resendVerificationCode(form.getValues("identifier"))
                }
              >
                {timer > 0 ? timer : "Send Code"}
              </Button>
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="new password"
                      autoComplete="new-password"
                      inputMode="text"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="confirm-password"
              render={() => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="confirm new password"
                      autoComplete="new-password webauthn"
                      inputMode="text"
                      onChange={(e) => setConfirmPwd(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="text-red-400 text-sm">
              {confirmPwd && confirmPwd !== form.getValues("password")
                ? "Passwords do not match"
                : ""}
            </span>
          </CardContent>
          <CardFooter className="flex justify-evenly">
            <Button
              type="submit"
              disabled={
                loading ||
                form.getValues("code").length !== 6 ||
                form.getValues("password").length < 6 ||
                confirmPwd !== form.getValues("password")
              }
            >
              {loading ? <Loader2 className="animate-spin" /> : "Verify"}
            </Button>
            <Link to="/sign-in">
              <Button variant="outline">Go back</Button>
            </Link>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default ForgotPasswordPage;
