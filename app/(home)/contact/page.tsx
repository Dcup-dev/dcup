"use client";
import React, { useRef, useState, FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
export default function ContactUs() {
  const form = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const sendEmail = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.current) return;

    setLoading(true);
    emailjs
      .sendForm(
        "service_o7dmsmk",
        "template_44i8ptx",
        form.current,
        "M3PNytkF0RPjKCPL5",
      )
      .then(
        () => {
          toast({ title: "Message sent successfully!" });
          form.current?.reset();
        },
        () => {
          toast({
            title: "Failed to send message. Please try again!",
            variant: "destructive",
          });
        },
      );
    setLoading(false);
  };

  return (
    <Card className="w-full max-w-xl mx-auto my-14 p-4">
      <CardHeader>
        <CardTitle className="text-2xl">Contact Support</CardTitle>
       <CardDescription className="text-lg">
          We&apos;re here to help. Send us a message and we&apos;ll get back to you as
          soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" ref={form} onSubmit={sendEmail}>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your Name"
              required
              disabled={loading}
              className="w-full"
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Your Email"
              required
              disabled={loading}
              className="w-full"
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Your Message"
              required
              disabled={loading}
              className="w-full min-h-40"
            />
          </div>
          <CardFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
