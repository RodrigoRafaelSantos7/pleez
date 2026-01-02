import { format } from "date-fns";
import { Calendar as CalendarIcon } from "@phosphor-icons/react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export type FiltersState = {
  startDate: string | undefined;
  endDate: string | undefined;
  platform: string;
};

type FiltersProps = {
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
};

export function Filters({ filters, onFiltersChange }: FiltersProps) {
  const startDateObj = filters.startDate ? new Date(filters.startDate) : undefined;
  const endDateObj = filters.endDate ? new Date(filters.endDate) : undefined;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">From:</span>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !startDateObj && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDateObj ? format(startDateObj, "MMM d, yyyy") : "Start date"}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDateObj}
              onSelect={(date) => {
                onFiltersChange({
                  ...filters,
                  startDate: date ? format(date, "yyyy-MM-dd") : undefined,
                });
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">To:</span>
        <Popover>
          <PopoverTrigger
            render={
              <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !endDateObj && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDateObj ? format(endDateObj, "MMM d, yyyy") : "End date"}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDateObj}
              onSelect={(date) => {
                onFiltersChange({
                  ...filters,
                  endDate: date ? format(date, "yyyy-MM-dd") : undefined,
                });
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Platform:</span>
        <Select
          value={filters.platform}
          onValueChange={(value) => {
            if (value !== null) {
              onFiltersChange({ ...filters, platform: value });
            }
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="UberEats">Uber Eats</SelectItem>
            <SelectItem value="Deliveroo">Deliveroo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(filters.startDate || filters.endDate || filters.platform !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onFiltersChange({
              startDate: undefined,
              endDate: undefined,
              platform: "all",
            });
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  );
}

