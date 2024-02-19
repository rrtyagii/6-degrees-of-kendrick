import clsx from 'clsx';
import Form from './ui/Input Form/Form';
import Button from "@/app/ui/Input Form/Button";

export default function Home() {
  const handleSearchClick = ()=>{
    console.log("searching");
  }

  return (
    <main className="flex flex-col items-center justify-between p-16 gap-y-4">
        <h1 className="text-4xl font-bold">
          Six Degrees of Kendrick
        </h1>

        <Form />

        <Button className="mt-36 w-48 p-8">
          Random
        </Button>
    </main>
  );
}
