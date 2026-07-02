import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { calculateMonthlySurplus } from "@/lib/savings/engine";
import { HeroCard } from "@/components/dashboard/hero-card";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CategoryDonut, type CategorySlice } from "@/components/dashboard/category-donut";
import { SpendingTrend, type TrendPoint } from "@/components/dashboard/spending-trend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OTROS_COLOR = "#64748b";
const MAX_SLICES = 6;

function monthRange(year: number, month: number) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

export default async function DashboardPage() {
  const userId = await requireUserId();

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const { start, end } = monthRange(year, month);

  const prevDate = new Date(Date.UTC(year, month - 2, 1));
  const prevYear = prevDate.getUTCFullYear();
  const prevMonth = prevDate.getUTCMonth() + 1;

  const trendStart = new Date(Date.UTC(year, month - 6, 1));

  const [expensesByCategory, currentSurplus, prevSurplus, savingsAgg, trendTx] =
    await Promise.all([
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: {
          userId,
          date: { gte: start, lt: end },
          amount: { lt: 0 },
          financialAccount: { isSavings: false },
        },
        _sum: { amount: true },
      }),
      calculateMonthlySurplus(prisma, { userId, year, month }),
      calculateMonthlySurplus(prisma, { userId, year: prevYear, month: prevMonth }),
      prisma.savingsGoal.aggregate({ where: { userId }, _sum: { currentAmount: true } }),
      prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: trendStart, lt: end },
          amount: { lt: 0 },
          financialAccount: { isSavings: false },
        },
        select: { amount: true, date: true },
      }),
    ]);

  const categoryIds = expensesByCategory
    .map((row) => row.categoryId)
    .filter((id): id is string => Boolean(id));
  const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const allSlices = expensesByCategory
    .map((row) => ({
      name: row.categoryId ? categoryById.get(row.categoryId)?.name ?? "Sin categoría" : "Sin categoría",
      color: (row.categoryId ? categoryById.get(row.categoryId)?.color : null) ?? OTROS_COLOR,
      value: Math.abs(Number(row._sum.amount ?? 0)),
    }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalExpenses = allSlices.reduce((acc, s) => acc + s.value, 0);

  let donutData: CategorySlice[] = allSlices;
  if (allSlices.length > MAX_SLICES) {
    const top = allSlices.slice(0, MAX_SLICES);
    const rest = allSlices.slice(MAX_SLICES).reduce((acc, s) => acc + s.value, 0);
    donutData = [...top, { name: "Otros", color: OTROS_COLOR, value: rest }];
  }

  // Tendencia de gasto: últimos 6 meses agrupados por mes.
  const monthlyTotals = new Map<string, number>();
  const trendPoints: TrendPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    monthlyTotals.set(key, 0);
    trendPoints.push({
      month: d.toLocaleDateString("es-CL", { month: "short" }),
      total: 0,
    });
  }
  for (const tx of trendTx) {
    const key = `${tx.date.getUTCFullYear()}-${tx.date.getUTCMonth()}`;
    if (monthlyTotals.has(key)) {
      monthlyTotals.set(key, monthlyTotals.get(key)! + Math.abs(Number(tx.amount)));
    }
  }
  let idx = 0;
  for (const value of monthlyTotals.values()) {
    trendPoints[idx].total = value;
    idx += 1;
  }

  const savingsTotal = Number(savingsAgg._sum.currentAmount ?? 0);
  const monthLabel = start.toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col gap-5">
      <HeroCard
        monthLabel={monthLabel}
        totalExpenses={totalExpenses}
        deltaVsPrev={currentSurplus - prevSurplus}
      />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          label="Excedente del mes"
          amount={Math.max(currentSurplus, 0)}
          variant="gradient"
          hint="Ingresos − gastos"
        />
        <StatTile label="Ahorro acumulado" amount={savingsTotal} hint="Metas de ahorro" />
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Gasto por categoría</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryDonut data={donutData} />
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">Tendencia de gasto (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <SpendingTrend data={trendPoints} />
        </CardContent>
      </Card>
    </div>
  );
}
