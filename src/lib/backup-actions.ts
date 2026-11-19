"use server";
import {redirect} from "next/navigation";
import {requirePermission} from "@/lib/access";
import {createLocalBackup} from "@/lib/backups";
export async function createBackup(){const actor=await requirePermission("backups.manage");await createLocalBackup(actor.id);redirect("/configuracion/respaldos")}
