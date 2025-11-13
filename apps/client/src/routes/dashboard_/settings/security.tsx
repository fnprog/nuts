import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { userService } from "@/features/preferences/services/user.service";
import { authApi } from "@/features/auth/api";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/core/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/core/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/core/components/ui/dialog";
import { Label } from "@/core/components/ui/label";
import { useState, Suspense } from "react";
import { arktypeResolver } from "@hookform/resolvers/arktype";
import { type } from "@nuts/validation";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/core/components/ui/form";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { InitMFASchema } from "@/features/auth/services/auth.types";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { H2, H3, P, Small } from "@/core/components/ui/typography";

const changePasswordFormSchema = type({
  currentPassword: "string>=1",
  newPassword: "string>=8",
  confirmPassword: "string",
}).narrow((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    return ctx.reject({ path: ["confirmPassword"], message: "Passwords don't match" });
  }
  return true;
});

type ChangePasswordFormValues = typeof changePasswordFormSchema.infer;

const createPasswordFormSchema = type({
  newPassword: "string>=8",
  confirmPassword: "string",
}).narrow((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    return ctx.reject({ path: ["confirmPassword"], message: "Passwords don't match" });
  }
  return true;
});

type CreatePasswordFormValues = typeof createPasswordFormSchema.infer;

const mfaVerifySchema = type({
  otp: "string>=6",
}).narrow((data, ctx) => {
  if (data.otp.length !== 6) {
    return ctx.reject({ path: ["otp"], message: "OTP must be exactly 6 characters" });
  }
  return true;
});

type MfaVerifyFormValues = typeof mfaVerifySchema.infer;

// --- Password Modal Components ---

interface CreatePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  form: ReturnType<typeof useForm<CreatePasswordFormValues>>;
  onSubmit: (data: CreatePasswordFormValues) => void;
  isPending: boolean;
}

function CreatePasswordModal({ isOpen, onOpenChange, form, onSubmit, isPending }: CreatePasswordModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) form.reset(); // Reset form when modal closes
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Password</DialogTitle>
          <DialogDescription>Create a new password for your account. Make sure it's at least 8 characters long.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>Must be at least 8 characters long.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creating..." : "Create Password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

interface UpdatePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  form: ReturnType<typeof useForm<ChangePasswordFormValues>>;
  onSubmit: (data: ChangePasswordFormValues) => void;
  isPending: boolean;
}

function UpdatePasswordModal({ isOpen, onOpenChange, form, onSubmit, isPending }: UpdatePasswordModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) form.reset(); // Reset form when modal closes
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Password</DialogTitle>
          <DialogDescription>Enter your current password and set a new one.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormDescription>Must be at least 8 characters long.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Changing..." : "Change Password"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/dashboard_/settings/security")({
  component: SecuritySettingsComponent,
  loader: ({ context }) => {
    const queryClient = context.queryClient;

    queryClient.prefetchQuery({
      queryKey: ["user"],
      queryFn: userService.getMe,
    });

    queryClient.prefetchQuery({
      queryKey: ["user", "sessions"],
      queryFn: userService.getSessions,
    });
  },
  gcTime: 1000 * 60 * 5,
  pendingComponent: () => <div>Loading security settings...</div>,
  pendingMs: 150,
  pendingMinMs: 200,
});

function SecuritySettingsComponent() {
  const queryClient = useQueryClient();
  const isAnonymous = useAuthStore((s) => s.isAnonymous);

  // --- State ---
  const [isMfaSetupModalOpen, setIsMfaSetupModalOpen] = useState(false);
  const [mfaSetupData, setMfaSetupData] = useState<InitMFASchema | null>(null);
  const [isUpdatePasswordModalOpen, setIsUpdatePasswordModalOpen] = useState(false);
  const [isCreatePasswordModalOpen, setIsCreatePasswordModalOpen] = useState(false);

  // --- Queries ---
  const { data: sessions } = useSuspenseQuery({
    queryKey: ["user", "sessions"],
    queryFn: userService.getSessions,
  });

  const { data: user } = useSuspenseQuery({
    queryKey: ["user"],
    queryFn: userService.getMe,
  });

  // --- Mutations ---
  const invalidateSecuritySettings = () => {
    queryClient.invalidateQueries({ queryKey: ["user"] });
    queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
  };

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { current_password: string; password: string }) => {
      const result = await userService.updatePassword(data);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      toast.success("Password changed successfully.");
      changePasswordForm.reset();
      setIsUpdatePasswordModalOpen(false);
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to change password: ${error.message}`);
    },
  });

  const createPasswordMutation = useMutation({
    mutationFn: async (password: string) => {
      const result = await userService.createPassword(password);
      if (result.isErr()) throw result.error;
      return result.value;
    },
    onSuccess: () => {
      toast.success("Password created successfully.");
      createPasswordForm.reset();
      setIsCreatePasswordModalOpen(false);
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to create password: ${error.message}`);
    },
  });

  // MFA Mutations
  const initiateMfaMutation = useMutation({
    mutationFn: authApi.initiateMfaSetup,
    onSuccess: (data) => {
      setMfaSetupData(data);
      setIsMfaSetupModalOpen(true);
      mfaVerifyForm.reset(); // Clear previous OTP attempts
    },
    onError: (error: Error) => {
      toast.error(`Failed to start MFA setup: ${error.message}`);
    },
  });

  const verifyMfaMutation = useMutation({
    mutationFn: authApi.verifyMfaSetup,
    onSuccess: () => {
      toast.success("MFA enabled successfully!");
      setIsMfaSetupModalOpen(false);
      setMfaSetupData(null);
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`MFA verification failed: ${error.message}`);
      // Optionally clear the OTP field on error
      mfaVerifyForm.resetField("otp");
    },
  });

  const disableMfaMutation = useMutation({
    mutationFn: authApi.disableMfa,
    onSuccess: () => {
      toast.success("MFA disabled.");
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to disable MFA: ${error.message}`);
    },
  });

  // Social Link Mutation
  const unlinkSocialMutation = useMutation({
    mutationFn: authApi.unlinkSocialAccount,
    onSuccess: () => {
      // toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} account unlinked.`);
      invalidateSecuritySettings();
    },
    onError: (error: Error, provider) => {
      toast.error(`Failed to unlink ${provider}: ${error.message}`);
    },
  });

  // Session Mutations
  const revokeSessionMutation = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: () => {
      toast.success("Session revoked.");
      invalidateSecuritySettings();
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke session: ${error.message}`);
    },
  });

  // const revokeAllOtherSessionsMutation = useMutation({
  //   mutationFn: authService.revokeAllOtherSessions,
  //   onSuccess: () => {
  //     toast.success("All other sessions revoked.");
  //     invalidateSecuritySettings();
  //   },
  //   onError: (error: Error) => {
  //     toast.error(`Failed to revoke sessions: ${error.message}`);
  //   },
  // });

  // --- Forms ---
  const changePasswordForm = useForm<ChangePasswordFormValues>({
    resolver: arktypeResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const createPasswordForm = useForm<CreatePasswordFormValues>({
    resolver: arktypeResolver(createPasswordFormSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const mfaVerifyForm = useForm<MfaVerifyFormValues>({
    resolver: arktypeResolver(mfaVerifySchema),
    defaultValues: { otp: "" },
  });

  // --- Event Handlers ---
  const onSubmitChangePassword = (data: ChangePasswordFormValues) => {
    changePasswordMutation.mutate({ current_password: data.currentPassword, password: data.newPassword });
  };

  const onSubmitCreatePassword = (data: CreatePasswordFormValues) => {
    createPasswordMutation.mutate(data.newPassword);
  };

  const onSubmitMfaVerify = (data: MfaVerifyFormValues) => {
    verifyMfaMutation.mutate(data.otp);
  };

  const getSocialIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "google":
        return "logos:google-icon";
      case "reddit":
        return "logos:reddit-icon";
      case "github":
        return "logos:github-icon";
      default:
        return "ph:question-fill"; // Default icon
    }
  };

  const formatSessionDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      console.error(e);
      return dateString; // Return original if parsing fails
    }
  };

  return (
    <div className="space-y-6">
      <Suspense fallback={<div>Loading security details...</div>}>
        {isAnonymous && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon="ph:shield-warning" className="size-5" />
                Sign In to Manage Security Settings
              </CardTitle>
              <CardDescription>
                You're currently using Nuts in local-only mode. Sign in to unlock security features like password management, MFA, and session control.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => (window.location.href = "/login")}>Sign In to Nuts</Button>
            </CardContent>
          </Card>
        )}
        {/* --- Password Management --- */}
        <Card>
          <CardHeader className="mb-4">
            <CardTitle>Email & Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-10">
            <div className="flex w-full justify-between">
              <div>
                <H2 className="font-medium">Email</H2>
                <Small>{user.email}</Small>
              </div>
              <div className="flex items-center gap-3">
                <Button disabled={isAnonymous}>Edit email</Button>
                {user?.linked_accounts?.map((account) => (
                  <div key={account.provider} className="bg-secondary flex h-9 items-center justify-between gap-2 rounded px-3 py-2">
                    <div className="flex items-center gap-3">
                      <Icon icon={getSocialIcon(account.provider)} className="h-4 w-4" />
                      <Small className="font-medium">{account.provider.charAt(0).toUpperCase() + account.provider.slice(1)} is linked</Small>
                    </div>
                    {/* Add check: Don't allow unlinking the *only* auth method if no password exists */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild disabled={isAnonymous}>
                        <button disabled={isAnonymous} className="disabled:cursor-not-allowed disabled:opacity-50">
                          <Icon className="h-4 w-4" icon="pixelarticons:close" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Unlink {account.provider.charAt(0).toUpperCase() + account.provider.slice(1)}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to unlink your {account.provider} account? You will no longer be able to log in using it.
                            {/* Add warning if it's the only login method */}
                            {user?.linked_accounts?.length === 1 && !user.has_password && (
                              <Small className="text-destructive mt-2 block font-semibold">
                                {" "}
                                Warning: This is your only login method. Please create a password first before unlinking.
                              </Small>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => unlinkSocialMutation.mutate(account.provider)}
                            disabled={unlinkSocialMutation.isPending || (user?.linked_accounts?.length === 1 && !user.has_password)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {unlinkSocialMutation.isPending ? "Unlinking..." : "Unlink"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
            {/* Password Section */}

            <div className="flex w-full justify-between">
              <div>
                <H3 className="font-medium">Password</H3>
                <Small variant="muted" className="mt-1">
                  {user.has_password
                    ? "Change your existing password."
                    : "You currently don't have a password set up. Create one for an alternative login method."}
                </Small>
              </div>
              <div className="flex items-center gap-3">
                {user.has_password ? (
                  <Button variant="outline" onClick={() => setIsUpdatePasswordModalOpen(true)} disabled={isAnonymous}>
                    Update Password
                  </Button>
                ) : (
                  <Button variant="outline" onClick={() => setIsCreatePasswordModalOpen(true)} disabled={isAnonymous}>
                    Create Password
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- Multi-Factor Authentication (MFA) --- */}
        <Card className="flex items-center justify-between">
          <CardHeader>
            <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
            <CardDescription>Add an extra layer of security to your account.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 pr-6">
            {!user.mfa_enabled ? (
              <Button onClick={() => initiateMfaMutation.mutate()} disabled={initiateMfaMutation.isPending || isAnonymous}>
                {initiateMfaMutation.isPending ? "Starting..." : "Enable MFA"}
              </Button>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" disabled={disableMfaMutation.isPending || isAnonymous}>
                    Disable MFA
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disable Multi-Factor Authentication?</AlertDialogTitle>
                    <AlertDialogDescription>Disabling MFA will reduce your account security. Are you sure you want to proceed?</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => disableMfaMutation.mutate()}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={disableMfaMutation.isPending}
                    >
                      {disableMfaMutation.isPending ? "Disabling..." : "Disable MFA"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </CardContent>
        </Card>

        {/* --- Active Sessions --- */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>Manage devices currently logged into your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {sessions.length > 0 ? (
              <ul className="space-y-3">
                {sessions.map((session) => (
                  <li key={session.id} className="flex flex-col items-start justify-between gap-2 rounded border p-3 sm:flex-row sm:items-center">
                    <div>
                      <Small className="font-medium">
                        {session.device_name} on {session.browser_name}
                      </Small>
                      <Small variant="muted">
                        Location: {session.location || "Unknown"} | Last Active: {formatSessionDate(session.last_used_at)}
                      </Small>
                    </div>
                    {/* {!session.isCurrent && ( */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={(revokeSessionMutation.isPending && revokeSessionMutation.variables === session.id) || isAnonymous}
                        >
                          Revoke
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke Session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to revoke access for the session on "{session.device_name}"? It will be logged out.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => revokeSessionMutation.mutate(session.id)}
                            disabled={revokeSessionMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {revokeSessionMutation.isPending && revokeSessionMutation.variables === session.id ? "Revoking..." : "Revoke"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {/* )} */}
                  </li>
                ))}
              </ul>
            ) : (
              <P variant="muted">No active sessions found.</P>
            )}
          </CardContent>
          {/* {securityData.sessions.filter(s => !s.isCurrent).length > 0 && ( */}
          {/*   <CardFooter> */}
          {/*     <AlertDialog> */}
          {/*       <AlertDialogTrigger asChild> */}
          {/*         <Button variant="destructive" disabled={revokeAllOtherSessionsMutation.isPending}>Revoke All Other Sessions</Button> */}
          {/*       </AlertDialogTrigger> */}
          {/*       <AlertDialogContent> */}
          {/*         <AlertDialogHeader> */}
          {/*           <AlertDialogTitle>Revoke All Other Sessions?</AlertDialogTitle> */}
          {/*           <AlertDialogDescription> */}
          {/*             Are you sure you want to log out from all devices except this one? */}
          {/*           </AlertDialogDescription> */}
          {/*         </AlertDialogHeader> */}
          {/*         <AlertDialogFooter> */}
          {/*           <AlertDialogCancel>Cancel</AlertDialogCancel> */}
          {/*           <AlertDialogAction */}
          {/*             onClick={() => revokeAllOtherSessionsMutation.mutate()} */}
          {/*             disabled={revokeAllOtherSessionsMutation.isPending} */}
          {/*             className="bg-destructive hover:bg-destructive/90" */}
          {/*           > */}
          {/*             {revokeAllOtherSessionsMutation.isPending ? "Revoking..." : "Revoke All"} */}
          {/*           </AlertDialogAction> */}
          {/*         </AlertDialogFooter> */}
          {/*       </AlertDialogContent> */}
          {/*     </AlertDialog> */}
          {/*   </CardFooter> */}
          {/* )} */}
        </Card>
      </Suspense>

      {/* --- MFA Setup Dialog --- */}
      <Dialog open={isMfaSetupModalOpen} onOpenChange={setIsMfaSetupModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Set up Multi-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy) or manually enter the secret key. Then enter the generated OTP
              below.
            </DialogDescription>
          </DialogHeader>
          {mfaSetupData && (
            <div className="space-y-4 py-4">
              {/* Display QR Code - Replace with actual QR component if you have one */}
              <div className="flex justify-center">
                <img src={mfaSetupData.qr_code_url} alt="MFA QR Code" className="border bg-white p-2" />
              </div>
              <div>
                <Label htmlFor="mfa-secret" className="text-sm font-medium">
                  Manual Setup Key:
                </Label>
                <Input id="mfa-secret" readOnly value={mfaSetupData.secret} className="mt-1 font-mono text-sm" />
                <Small variant="muted" className="mt-1 text-xs">
                  Enter this key into your authenticator app if you cannot scan the QR code.
                </Small>
              </div>

              <Form {...mfaVerifyForm}>
                <form onSubmit={mfaVerifyForm.handleSubmit(onSubmitMfaVerify)} className="space-y-3">
                  <FormField
                    control={mfaVerifyForm.control}
                    name="otp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Code (OTP)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123456" maxLength={6} inputMode="numeric" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={verifyMfaMutation.isPending}>
                      {verifyMfaMutation.isPending ? "Verifying..." : "Verify & Enable"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Password Modals --- */}
      <CreatePasswordModal
        isOpen={isCreatePasswordModalOpen}
        onOpenChange={setIsCreatePasswordModalOpen}
        form={createPasswordForm}
        onSubmit={onSubmitCreatePassword}
        isPending={createPasswordMutation.isPending}
      />
      <UpdatePasswordModal
        isOpen={isUpdatePasswordModalOpen}
        onOpenChange={setIsUpdatePasswordModalOpen}
        form={changePasswordForm}
        onSubmit={onSubmitChangePassword}
        isPending={changePasswordMutation.isPending}
      />
    </div>
  );
}
