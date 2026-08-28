import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_DESCRIPTION, APP_NAME, NAV_ITEMS } from "@/lib/constants";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{APP_NAME}</CardTitle>
          <CardDescription>{APP_DESCRIPTION}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            현재 상태: 프로젝트 초기 설정 완료
          </p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          앞으로 구현할 메뉴
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.key}
              variant="outline"
              size="lg"
              disabled
              className="justify-between"
            >
              <span>{item.label}</span>
              <span className="text-xs font-normal">준비 중</span>
            </Button>
          ))}
        </div>
      </section>
    </main>
  );
}
