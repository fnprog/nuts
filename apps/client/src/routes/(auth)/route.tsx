import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { motion } from "motion/react";
import { Noise } from "@/core/components/ui/noise";
import { Nuts } from "@/core/components/icons/Logo";

export const Route = createFileRoute('/(auth)')({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated || context.auth.isAnonymous) {
      throw redirect({ to: "/dashboard/home" });
    }
  },
  shouldReload({ context }) {
    return !context.auth.isAuthenticated;
  },
})

function RouteComponent() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-3/6 overflow-hidden bg-linear-to-t from-black via-gray-800 to-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex items-center gap-2">
            <Nuts className="h-8 w-8" fill="var(--color-gray-800)" />
            <span className="text-2xl text-gray-800 font-bold">Nuts</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }} className="max-w-md ">
          <h2 className="text-5xl font-bold leading-tight text-white">Your personal finance & wealth workspace</h2>
        </motion.div>

        <Noise />
      </div>

      <div className="flex w-full items-center justify-center bg-white p-8 lg:w-4/6">
        <Outlet />
      </div>
    </div>
  );
}
