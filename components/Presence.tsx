"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Presence() {
  useEffect(() => {
    let heartbeat: ReturnType<typeof setInterval> | null = null;

    const updatePresence = async () => {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth error:", authError.message);
          return;
        }

        if (!user) {
          return;
        }

        /*
         * Get the username from admin_profiles.
         * This is the username the user selected
         * in their account settings.
         */
        const { data: profile, error: profileError } = await supabase
          .from("admin_profiles")
          .select("username")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile lookup failed:",
            profileError.message
          );
        }

        const username =
          profile?.username?.trim() ||
          user.user_metadata?.username ||
          user.user_metadata?.user_name ||
          user.email?.split("@")[0] ||
          "User";

        /*
         * Find the existing team member.
         */
        const { data: existingMember, error: findMemberError } =
          await supabase
            .from("team_members")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (findMemberError) {
          console.error(
            "Team member lookup failed:",
            findMemberError.message
          );
        } else if (existingMember) {
          /*
           * Update the existing member's username.
           */
          const { error: updateMemberError } = await supabase
            .from("team_members")
            .update({
              username,
            })
            .eq("id", existingMember.id);

          if (updateMemberError) {
            console.error(
              "Team member update failed:",
              updateMemberError.message
            );
          }
        } else {
          /*
           * Register the user as a team member.
           */
          const { error: insertMemberError } = await supabase
            .from("team_members")
            .insert({
              user_id: user.id,
              username,
            });

          if (insertMemberError) {
            console.error(
              "Team member creation failed:",
              insertMemberError.message
            );
          }
        }

        /*
         * Find the existing presence record.
         */
        const { data: existingStatus, error: findStatusError } =
          await supabase
            .from("team_status")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (findStatusError) {
          console.error(
            "Presence lookup failed:",
            findStatusError.message
          );
        } else if (existingStatus) {
          /*
           * Update existing presence.
           */
          const { error: updateStatusError } = await supabase
            .from("team_status")
            .update({
              status: "Online",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingStatus.id);

          if (updateStatusError) {
            console.error(
              "Presence update failed:",
              updateStatusError.message
            );
          }
        } else {
          /*
           * Create presence for the first time.
           */
          const { error: insertStatusError } = await supabase
            .from("team_status")
            .insert({
              user_id: user.id,
              status: "Online",
              updated_at: new Date().toISOString(),
            });

          if (insertStatusError) {
            console.error(
              "Presence creation failed:",
              insertStatusError.message
            );
          }
        }
      } catch (error) {
        console.error("Presence error:", error);
      }
    };

    const startPresence = async () => {
      await updatePresence();

      heartbeat = setInterval(() => {
        updatePresence();
      }, 30_000);
    };

    startPresence();

    return () => {
      if (heartbeat) {
        clearInterval(heartbeat);
      }
    };
  }, []);

  return null;
}