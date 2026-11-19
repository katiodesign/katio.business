import "server-only";
import Decimal from "decimal.js";
import {db} from "@/lib/db";
import {monthlyEquivalent} from "@/lib/money";

export async function getMonthlyPricingExpenses(){
 const expenses=await db.operatingExpense.findMany({where:{active:true,deletedAt:null},select:{amount:true,periodicity:true}});
 return expenses.reduce((sum,expense)=>sum.plus(monthlyEquivalent(expense.amount.toString(),expense.periodicity)),new Decimal(0)).toFixed(2);
}
