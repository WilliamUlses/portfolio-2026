"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/admin/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/admin/ui/card";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/admin/ui/tabs";
import { Textarea } from "@/components/admin/ui/textarea";
import { updatePost } from "@/server/actions/posts";
import type { MediaOption } from "@/server/admin/media";
import { describedBy, FieldError } from "./FieldError";
import { MediaPicker } from "./MediaPicker";
import { PostThumbnailStudio } from "./PostThumbnailStudio";

type TranslationValues = {
  title: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
};

type Props = {
  initial: {
    id: string;
    slug: string;
    topic: string;
    coverMediaId: string;
    thumbnailTitle?: string | null;
    fr: TranslationValues;
    en: TranslationValues;
    hasEn: boolean;
  };
  media: MediaOption[];
};

// Journal post edit form: texts FR/EN, slug, topic and cover (blocks edited separately).
export function PostEditForm({ initial, media }: Props) {
  const [coverMediaId, setCoverMediaId] = useState(initial.coverMediaId);
  const [state, action, pending] = useActionState(updatePost, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) toast.success("Article enregistré");
    else toast.error(state.message);
  }, [state]);

  const field = (
    name: string,
    label: string,
    defaultValue: string,
    options: { multiline?: boolean; hint?: string; lang?: string } = {},
  ) => (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>
        {label}
        {options.hint && (
          <span className="font-normal text-muted-foreground">
            {" "}
            — {options.hint}
          </span>
        )}
      </Label>
      {options.multiline ? (
        <Textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={3}
          lang={options.lang}
          aria-describedby={describedBy(state, name)}
        />
      ) : (
        <Input
          id={name}
          name={name}
          defaultValue={defaultValue}
          lang={options.lang}
          aria-describedby={describedBy(state, name)}
        />
      )}
      <FieldError state={state} name={name} />
    </div>
  );

  const translationFields = (locale: "fr" | "en", v: TranslationValues) => {
    const fr = locale === "fr";
    return (
      <div lang={locale} className="grid gap-4">
        {!fr && !initial.hasEn && (
          <p className="rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground">
            Pas encore de traduction anglaise : elle sera créée dès qu'un titre
            est saisi.
          </p>
        )}
        {field(`${locale}.title`, fr ? "Titre" : "Title", v.title, {
          lang: locale,
        })}
        {field(`${locale}.excerpt`, fr ? "Chapeau" : "Excerpt", v.excerpt, {
          multiline: true,
          hint: fr
            ? "résumé affiché dans la liste, 400 car. max"
            : "shown in the list, 400 chars max",
          lang: locale,
        })}
        <div className="grid gap-4 md:grid-cols-2">
          {field(`${locale}.seoTitle`, "SEO — title", v.seoTitle, {
            hint: "70 car. max",
            lang: locale,
          })}
          {field(
            `${locale}.seoDescription`,
            "SEO — description",
            v.seoDescription,
            { multiline: true, hint: "160 car. max", lang: locale },
          )}
        </div>
      </div>
    );
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => action(data));
      }}
      noValidate
      className="grid gap-6"
    >
      <input type="hidden" name="id" value={initial.id} />
      <Card>
        <CardHeader>
          <CardTitle>Textes</CardTitle>
          <CardDescription>
            Les deux langues sont enregistrées ensemble.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fr">
            <TabsList>
              <TabsTrigger value="fr">Français</TabsTrigger>
              <TabsTrigger value="en">
                English{!initial.hasEn && " (à créer)"}
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="fr"
              forceMount
              className="mt-4 data-[state=inactive]:hidden"
            >
              {translationFields("fr", initial.fr)}
            </TabsContent>
            <TabsContent
              value="en"
              forceMount
              className="mt-4 data-[state=inactive]:hidden"
            >
              {translationFields("en", initial.en)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-3">
          <div className="grid content-start gap-4 md:col-span-2">
            {field("slug", "Slug", initial.slug, {
              hint: "URL, identique en FR et EN",
            })}
            {field("topic", "Sujet", initial.topic, {
              hint: "ex. WebGL, Next.js, CSS — facultatif",
            })}
          </div>
          <MediaPicker
            name="coverMediaId"
            label="Couverture"
            hint="facultatif (si vide, la miniature Liquid Glass ci-dessous est utilisée)"
            media={media}
            kinds={["image", "svg"]}
            value={coverMediaId ? [coverMediaId] : []}
            onChange={(ids) => setCoverMediaId(ids[0] ?? "")}
          />
        </CardContent>
      </Card>

      <PostThumbnailStudio
        postId={initial.id}
        slug={initial.slug}
        initialThumbnailTitle={initial.thumbnailTitle || initial.fr.title}
        initialCoverUrl={media.find((m) => m.id === coverMediaId)?.url ?? null}
        onThumbnailGenerated={({ mediaId }) => {
          setCoverMediaId(mediaId);
        }}
      />

      <div className="sticky bottom-0 z-10 -mx-6 flex items-center gap-3 border-t border-border bg-background/95 px-6 py-3 backdrop-blur">
        <Button type="submit" disabled={pending} size="lg">
          {pending ? "Enregistrement…" : "Enregistrer l'article"}
        </Button>
        <span aria-live="polite" className="text-sm">
          {state?.ok && <span className="text-success">Enregistré ✓</span>}
          {state && !state.ok && (
            <span role="alert" className="text-destructive">
              {state.message}
            </span>
          )}
        </span>
      </div>
    </form>
  );
}
