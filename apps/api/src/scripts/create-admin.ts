import { supabase } from "../lib/auth-store";
import { logger } from "../lib/logger";

async function main() {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("Uso: pnpm --filter @workspace/api run create-admin -- <email>");
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  logger.info({ email }, "Promoting user to admin...");

  // 1. Check if user exists in amal_users table
  const { data: user, error: findError } = await supabase
    .from("amal_users")
    .select("id, name, email, role")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    logger.error({ err: findError }, "Error querying amal_users table");
    console.error("❌ Error al consultar la tabla amal_users:", findError.message);
    process.exit(1);
  }

  if (user) {
    const { error: updateError } = await supabase
      .from("amal_users")
      .update({ role: "admin" })
      .eq("id", user.id);

    if (updateError) {
      logger.error({ err: updateError }, "Failed to update role in amal_users");
      console.error("❌ Error al actualizar el rol:", updateError.message);
      process.exit(1);
    }

    logger.info({ email, id: user.id }, "User promoted to admin successfully");
    console.log(`✅ Usuario ${email} (ID: ${user.id}) promocionado a rol 'admin' con éxito.`);
    process.exit(0);
  }

  // 2. If not found in amal_users, check Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    logger.error({ err: authError }, "Error querying Supabase Auth users");
    console.error("❌ Error al listar usuarios de Supabase Auth:", authError.message);
    process.exit(1);
  }

  const authUser = authData.users.find((u) => u.email?.toLowerCase() === email);
  if (!authUser) {
    console.error(`❌ No se encontró ningún usuario con el correo: ${email}`);
    console.error("El usuario debe registrarse previamente en la aplicación antes de poder promocionarlo a admin.");
    process.exit(1);
  }

  const name =
    (authUser.user_metadata?.name as string) ||
    email.split("@")[0] ||
    "Admin";

  const { error: insertError } = await supabase.from("amal_users").insert({
    id: authUser.id,
    name,
    email,
    role: "admin",
  });

  if (insertError) {
    logger.error({ err: insertError }, "Failed to insert admin record into amal_users");
    console.error("❌ Error al crear registro de admin en amal_users:", insertError.message);
    process.exit(1);
  }

  logger.info({ email, id: authUser.id }, "Admin record created in amal_users with role admin");
  console.log(`✅ Usuario ${email} (ID: ${authUser.id}) configurado con rol 'admin' con éxito.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
