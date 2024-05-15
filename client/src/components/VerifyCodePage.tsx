import React from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useUser } from "@/context/UserProvider";
import { Loader2 } from "lucide-react";
import { toast } from "./ui/use-toast";

interface FormInput {
  code: string;
  username: string;
}

const VerifyCodePage = () => {
  const form = useForm<FormInput>({
    defaultValues: {
      username: "",
      code: "",
    },
  });
  const { search } = useLocation();

  const { verifyMail, loading } = useUser();
  const [timer, setTimer] = React.useState(30);
  const [isSendingMail, setIsSendingMail] = React.useState(false);

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

  function onSubmit(data: FormInput) {
    verifyMail(data);
  }

  React.useEffect(() => {
    const params = search.replace("?", "").split("&");
    params.map((param: string) => {
      if (param.includes("code")) {
        const code = param.split("=")[1];
        form.setValue("code", code);
      }
      if (param.includes("username")) {
        const username = param.split("=")[1];
        form.setValue("username", username);
      }
    });
  }, [search]);

  React.useEffect(() => {
    if (timer > 0) {
      const runningTimer = setInterval(() => {
        setTimer((timer) => (timer -= 1));
      }, 1000);
      () => clearInterval(runningTimer);
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
              Verify your account
            </CardTitle>
            <CardDescription>
              Please enter the verification code sent to your email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="verification code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <p>
              Not recieved email?
              <button
                className="text-blue-500 disabled:opacity-80 mt-2"
                disabled={timer > 0 || isSendingMail}
                onClick={() =>
                  resendVerificationCode(form.getValues("username"))
                }
                type="button"
              >
                &nbsp;{timer > 0 ? timer : "Resend"}
              </button>
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Verify"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default VerifyCodePage;
