import { Badge } from '@/ui-kit/ui/badge';
import RoomCard from '@/app/room/[roomId]/RoomCard';

type Member = {
  id: string;
  name: string;
  status: 'joined' | 'pending';
};

type Props = {
  members: Member[];
};

const getInitials = (name: Member['name']) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const Participants = ({ members }: Props) => {
  const joinedCount = members.filter((m) => m.status === 'joined').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  return (
    <RoomCard
      title="Participants"
      tool={
        <span className="text-xs font-medium bg-muted border rounded-full px-2 py-0.5 text-muted-foreground">
          {joinedCount} joined · {pendingCount} pending
        </span>
      }
    >
      <div className="flex flex-col">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between py-2 border-b last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <div
                className={
                  member.status === 'joined'
                    ? 'size-[22px] rounded-full bg-secondary-foreground text-secondary flex items-center justify-center text-[9px] font-medium flex-shrink-0'
                    : 'size-[22px] rounded-full bg-info-foreground text-info-text flex items-center justify-center text-[9px] font-medium flex-shrink-0'
                }
              >
                {getInitials(member.name)}
              </div>
              <span className="text-xs">{member.name}</span>
            </div>
            <Badge variant={member.status === 'joined' ? 'success' : 'info'} outline>
              {member.status}
            </Badge>
          </div>
        ))}
      </div>
    </RoomCard>
  );
};

export default Participants;
