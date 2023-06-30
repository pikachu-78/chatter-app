import { useEffect, useState } from "react";
import useActiveList from "./useActiveList";
import { Channel, Members } from "pusher-js";
import { pusherClient } from "../libs/pusher";
import { useSession } from "next-auth/react";

const useActiveChannel = () => {
  const { set, add, remove } = useActiveList();
  const session = useSession();
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  useEffect(() => {
    let channel = activeChannel;

    if (session.status !== "authenticated") return;
    // we don't have to subscribe if user is not logged in
    if (!channel) {
      // presence- is mandatory
      channel = pusherClient.subscribe("presence-messenger");
      setActiveChannel(channel);
    }
    channel.bind("pusher:subscription_succeeded", (members: Members) => {
      const initialMembers: string[] = [];
      // not normal object
      members.each((member: Record<string, any>) => {
        initialMembers.push(member.id);
      });
      set(initialMembers);
    });
    channel.bind("pusher:member_added", (member: Record<string, any>) => {
      add(member.id);
    });
    channel.bind("pusher:member_removed", (member: Record<string, any>) => {
      remove(member.id);
    });
    return () => {
      if (activeChannel) {
        pusherClient.unsubscribe("presence-messenger");
        setActiveChannel(null);
      }
    };
  }, [activeChannel, set, add, remove, session.status]);
};

export default useActiveChannel;
