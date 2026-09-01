import { DEFAULT, Site } from "./site";
import { supabase } from "./supabase";

export async function getSite(): Promise<Site> {
  try {
    const { data, error } = await supabase
      .from("site_config")
      .select("data")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "FAILED TO LOAD SITE:",
        JSON.stringify(error, null, 2)
      );

      return DEFAULT;
    }

    if (
      !data?.data ||
      typeof data.data !== "object"
    ) {
      return DEFAULT;
    }

    return normalizeSite(data.data);
  } catch (error) {
    console.error("FAILED TO LOAD SITE:", error);
    return DEFAULT;
  }
}

function normalizeSite(data: any): Site {
  return {
    ...DEFAULT,
    ...(data || {}),

    visible: {
      ...DEFAULT.visible,
      ...(data?.visible || {}),
    },

    games: {
      ...DEFAULT.games,
      ...(data?.games || {}),

      gt: {
        ...DEFAULT.games.gt,
        ...(data?.games?.gt || {}),
      },

      od: {
        ...DEFAULT.games.od,
        ...(data?.games?.od || {}),
      },
    },

    colors: {
      ...DEFAULT.colors,
      ...(data?.colors || {}),
    },

    players: Array.isArray(data?.players)
      ? data.players
      : DEFAULT.players,
  };
}

export async function putSite(site: Site): Promise<void> {
  const cleanSite = normalizeSite(site);

  /*
   * Your Supabase table uses an auto-generated ID.
   * Therefore we DO NOT send an "id" value.
   *
   * Since this is a single-row configuration table,
   * we update the existing row instead of trying to
   * insert a specific ID.
   */

  const { data: existing, error: findError } = await supabase
    .from("site_config")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (findError) {
    console.error(
      "FAILED TO FIND SITE ROW:",
      JSON.stringify(findError, null, 2)
    );

    throw new Error(
      [
        `message: ${findError.message}`,
        `code: ${findError.code}`,
        `details: ${findError.details}`,
        `hint: ${findError.hint}`,
      ].join("\n")
    );
  }

  let error;

  if (existing?.id !== undefined && existing?.id !== null) {
    const result = await supabase
      .from("site_config")
      .update({
        data: cleanSite,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    error = result.error;
  } else {
    const result = await supabase
      .from("site_config")
      .insert({
        data: cleanSite,
        updated_at: new Date().toISOString(),
      });

    error = result.error;
  }

  if (error) {
    console.error(
      "FAILED TO SAVE SITE:",
      JSON.stringify(error, null, 2)
    );

    throw new Error(
      [
        `message: ${error.message}`,
        `code: ${error.code}`,
        `details: ${error.details}`,
        `hint: ${error.hint}`,
      ].join("\n")
    );
  }

  console.log("SITE SAVED SUCCESSFULLY");
}

export async function clearSite(): Promise<void> {
  const { data: existing, error: findError } = await supabase
    .from("site_config")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (findError) {
    console.error(
      "FAILED TO FIND SITE ROW:",
      JSON.stringify(findError, null, 2)
    );

    throw new Error(
      [
        `message: ${findError.message}`,
        `code: ${findError.code}`,
        `details: ${findError.details}`,
        `hint: ${findError.hint}`,
      ].join("\n")
    );
  }

  if (!existing?.id) {
    // Nothing exists yet, so there is nothing to reset.
    return;
  }

  const { error } = await supabase
    .from("site_config")
    .update({
      data: DEFAULT,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id);

  if (error) {
    console.error(
      "FAILED TO RESET SITE:",
      JSON.stringify(error, null, 2)
    );

    throw new Error(
      [
        `message: ${error.message}`,
        `code: ${error.code}`,
        `details: ${error.details}`,
        `hint: ${error.hint}`,
      ].join("\n")
    );
  }

  console.log("SITE RESET SUCCESSFULLY");
}