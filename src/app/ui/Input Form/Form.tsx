import Input from "./Input";
import Button from "./Button";

export default function Form(){
    return(
        <div className="relative flex flex-col flex-1 flex-shrink-0 mt-12 w-full md:px-48 p-8">
            <Input placeholder="Enter your artist"/>
            <Button>
                Search
            </Button>
        </div>
    );
}