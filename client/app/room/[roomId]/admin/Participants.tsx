import { Badge } from '@/ui-kit/ui/badge';
import RoomCard from '@/app/room/[roomId]/components/RoomCard';
import { Skeleton } from '@/ui-kit/ui/skeleton';
import { Users } from 'lucide-react';
import { RoomInvite, RoomMember } from '@/src/api/dto/room.dto';
import { cn } from '@/ui-kit/utils';

type Props = {
  members: RoomMember[];
  invites: RoomInvite[];
  isLoading?: boolean;
};

const getInitials = (name: RoomMember['name']) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const NoParticipantsPlaceholder = () => (
  <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground flex-shrink-0">
    <Users className="size-8 opacity-40" />
    <p className="text-sm">No participants yet</p>
  </div>
);

const ParticipantsSkeleton = () => (
  <div className="flex flex-col">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
        <div className="flex items-center gap-2">
          <Skeleton className="size-[22px] rounded-full flex-shrink-0" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    ))}
  </div>
);

const ContentGuard = ({
  isLoading,
  noContent,
  children,
}: {
  isLoading?: boolean;
  noContent: boolean;
  children: React.ReactNode;
}) => {
  if (isLoading) {
    return <ParticipantsSkeleton />;
  }

  if (noContent) {
    return <NoParticipantsPlaceholder />;
  }

  return children;
};

const MemberStatusItem = ({ isActive, name }: { isActive: boolean; name: string }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'size-[22px] rounded-full bg-secondary-foreground text-secondary flex items-center justify-center text-[9px] font-medium flex-shrink-0',
            isActive && 'bg-primary text-primary-foreground',
            !isActive && 'bg-info-foreground text-info-text'
          )}
        >
          {getInitials(name)}
        </div>
        <span className="text-xs">{name}</span>
      </div>
      <Badge variant={isActive ? 'success' : 'info'} outline>
        {isActive ? 'Active' : 'Invited'}
      </Badge>
    </div>
  );
};

const Participants = ({ members, invites, isLoading }: Props) => {
  const joinedCount = members.length;
  const pendingCount = invites.length;

  return (
    <RoomCard
      title="Participants"
      tool={
        <span className="text-xs font-medium bg-muted border rounded-full px-2 py-0.5 text-muted-foreground">
          {joinedCount} joined · {pendingCount} pending
        </span>
      }
    >
      <ContentGuard isLoading={isLoading} noContent={!members.length && !invites.length}>
        <div className="flex flex-col">
          {members.map((member) => (
            <MemberStatusItem key={member.id} name={member.name} isActive />
          ))}
          {invites.map((invite) => (
            <MemberStatusItem key={invite.id} name={invite.name} isActive={false} />
          ))}
        </div>
      </ContentGuard>
    </RoomCard>
  );
};

export default Participants;
