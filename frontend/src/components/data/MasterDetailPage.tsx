import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "../ui/Button";
import { PageHeader } from "../layout/PageHeader";
import { DataGrid } from "./DataGrid";
import { EntityForm } from "./EntityForm";
import type { MasterDetailPageConfig } from "./dataTypes";

type MasterDetailPageProps<
  TRecord extends { id: string },
  TCreate extends Record<string, unknown>,
  TUpdate = Partial<TCreate>,
> = {
  config: MasterDetailPageConfig<TRecord, TCreate, TUpdate>;
  defaultCreateValue: TCreate;
};

export function MasterDetailPage<
  TRecord extends { id: string },
  TCreate extends Record<string, unknown>,
  TUpdate = Partial<TCreate>,
>({
  config,
  defaultCreateValue,
}: MasterDetailPageProps<TRecord, TCreate, TUpdate>) {
  const queryClient = useQueryClient();
  const [selectedRecord, setSelectedRecord] = useState<TRecord | null>(null);
  const [formValue, setFormValue] = useState<TCreate>(defaultCreateValue);

  const listQuery = useQuery({
    queryKey: config.queryKey,
    queryFn: config.api.list,
  });

  const createMutation = useMutation({
    mutationFn: config.api.create,
    onSuccess: async () => {
      setFormValue(defaultCreateValue);
      await queryClient.invalidateQueries({ queryKey: config.queryKey });
    },
  });

  const records = listQuery.data ?? [];
  const selectedLabel = useMemo(() => {
    if (!selectedRecord) {
      return "Select a row to view related details.";
    }

    return config.getRecordLabel?.(selectedRecord) ?? selectedRecord.id;
  }, [config, selectedRecord]);

  return (
    <section className="grid gap-6">
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        actions={
          <Button
            variant="secondary"
            onClick={() => setFormValue(defaultCreateValue)}
          >
          New
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-3">
          {listQuery.isError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {listQuery.error.message}
            </p>
          )}
          <DataGrid
            columns={config.columns}
            emptyMessage={listQuery.isLoading ? "Loading..." : "No records found."}
            records={records}
            selectedId={selectedRecord?.id}
            onSelect={setSelectedRecord}
          />
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-slate-950">Detail area</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">
              {selectedLabel}
            </p>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-slate-950">Create</h2>
          <EntityForm
            disabled={createMutation.isPending}
            fields={config.formFields}
            submitLabel={createMutation.isPending ? "Saving..." : "Save"}
            value={formValue}
            onChange={setFormValue}
            onSubmit={(value) => createMutation.mutate(value)}
          />
          {createMutation.isError && (
            <p className="mt-4 text-sm font-bold text-red-700">
              {createMutation.error.message}
            </p>
          )}
        </aside>
      </div>
    </section>
  );
}
