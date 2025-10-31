import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X } from 'lucide-react';
import { useMatching } from '@/contexts/MatchingContext';
import { Match } from '@/types/matching';
import { getTopMatches, getAllMatches } from '@/lib/matching-algorithm';
import { minWeightAssign } from 'munkres-algorithm';

export default function Matches() {
  const navigate = useNavigate();
  const { matches, mentors, mentees, updateMatch } = useMatching();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [optimalPairings, setOptimalPairings] = useState<Map<string, string>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const approvedMatches = useMemo(() =>
    matches.filter(m => m.status === 'approved'),
    [matches]
  );

  useEffect(() => {
    if (matches.length === 0) {
      navigate('/criteria');
      return;
    }

    generateGraph();
  }, [matches, approvedMatches]);

  const generateGraph = () => {
    const pendingMatches = matches.filter(m => m.status === 'pending');
    const approved = approvedMatches;

    // Create approved pairs set
    const approvedPairs = new Set<string>();
    approved.forEach(match => {
      approvedPairs.add(match.mentorId);
      approvedPairs.add(match.menteeId);
    });

    // Calculate optimal matches using Hungarian algorithm ONLY ONCE on first load
    let mentorMatches = new Map<string, Match[]>();

    if (!isInitialized && matches.length > 0) {
      // First time - calculate the optimal assignment with ALL mentors and mentees
      const matrix: number[][] = [];

      // Use ALL mentors and mentees for the initial calculation
      mentors.forEach(mentor => {
        const allMatches = getAllMatches(matches, mentor.id, undefined);
        const rowList: number[] = [];

        mentees.forEach(mentee => {
          const match = allMatches.find(m => m.menteeId === mentee.id);
          rowList.push(match ? (1 - match.normalizedScore) : 1);
        });

        matrix.push(rowList);
      });

      // Run Hungarian algorithm
      if (matrix.length > 0 && matrix[0].length > 0) {
        const result = minWeightAssign(matrix);
        const newOptimalPairings = new Map<string, string>();

        result.assignments.forEach((menteeIndex, mentorIndex) => {
          const mentor = mentors[mentorIndex];
          const mentee = mentees[menteeIndex];
          if (mentor && mentee) {
            newOptimalPairings.set(mentor.id, mentee.id);
          }
        });

        // Store the optimal pairing (mentor.id -> mentee.id) - this NEVER changes
        setOptimalPairings(newOptimalPairings);
        setIsInitialized(true);

        // Build mentorMatches for display (only pending ones)
        newOptimalPairings.forEach((menteeId, mentorId) => {
          if (!approvedPairs.has(mentorId) && !approvedPairs.has(menteeId)) {
            const match = matches.find(
              m => m.mentorId === mentorId && m.menteeId === menteeId
            );
            if (match && match.status === 'pending') {
              mentorMatches.set(mentorId, [match]);
            }
          }
        });
      }
    } else {
      // Use the stored optimal assignment, just filter out approved pairs
      optimalPairings.forEach((menteeId, mentorId) => {
        // Skip if either mentor or mentee has been approved
        if (approvedPairs.has(mentorId) || approvedPairs.has(menteeId)) {
          return;
        }

        // Find the current match object
        const match = matches.find(
          m => m.mentorId === mentorId && m.menteeId === menteeId
        );

        if (match && match.status === 'pending') {
          mentorMatches.set(mentorId, [match]);
        }
      });
    }

    // Create nodes - approved matches at top
    const newNodes: Node[] = [];

    approved.forEach((match, index) => {
      const mentor = mentors.find(m => m.id === match.mentorId);
      const mentee = mentees.find(m => m.id === match.menteeId);
      
      if (mentor && mentee) {
        const yPos = 50 + index * 120;
        newNodes.push(
          {
            id: `mentor-${match.mentorId}-approved`,
            type: 'default',
            position: { x: 100, y: yPos },
            data: { 
              label: (
                <div className="text-xs">
                  <div className="font-semibold">✓ {mentor.id}</div>
                  <div className="text-muted-foreground">{mentor.levelOfStudies}</div>
                </div>
              )
            },
            style: { 
              background: 'hsl(var(--accent))',
              color: 'white',
              border: '2px solid hsl(var(--accent))',
              borderRadius: '8px',
              padding: '12px'
            }
          },
          {
            id: `mentee-${match.menteeId}-approved`,
            type: 'default',
            position: { x: 600, y: yPos },
            data: { 
              label: (
                <div className="text-xs">
                  <div className="font-semibold">✓ {mentee.id}</div>
                  <div className="text-muted-foreground">{mentee.levelOfStudies}</div>
                </div>
              )
            },
            style: { 
              background: 'hsl(var(--accent))',
              color: 'white',
              border: '2px solid hsl(var(--accent))',
              borderRadius: '8px',
              padding: '12px'
            }
          }
        );
      }
    });

    // Create nodes for pending matches
    const pendingMentors = mentors.filter(m => !approvedPairs.has(m.id) && mentorMatches.has(m.id));
    const pendingMentees = mentees.filter(m => !approvedPairs.has(m.id));

    // Get all mentee IDs that are in the best matches
    const matchedMenteeIds = new Set<string>();
    mentorMatches.forEach(matches => {
      matches.forEach(match => matchedMenteeIds.add(match.menteeId));
    });
    const filteredPendingMentees = pendingMentees.filter(m => matchedMenteeIds.has(m.id));
    
    const startY = 50 + approved.length * 120 + 100;
    
    pendingMentors.forEach((mentor, index) => {
      newNodes.push({
        id: `mentor-${mentor.id}`,
        type: 'default',
        position: { x: 100, y: startY + index * 100 },
        data: { 
          label: (
            <div className="text-xs">
              <div className="font-semibold">{mentor.id}</div>
            </div>
          )
        },
        style: { 
          background: 'hsl(var(--primary))',
          color: 'white',
          border: '2px solid hsl(var(--primary))',
          borderRadius: '8px',
          padding: '12px'
        }
      });
    });

    filteredPendingMentees.forEach((mentee, index) => {
      newNodes.push({
        id: `mentee-${mentee.id}`,
        type: 'default',
        position: { x: 600, y: startY + index * 100 },
        data: {
          label: (
            <div className="text-xs">
              <div className="font-semibold">{mentee.id}</div>
            </div>
          )
        },
        style: {
          background: 'hsl(var(--secondary))',
          color: 'white',
          border: '2px solid hsl(var(--secondary))',
          borderRadius: '8px',
          padding: '12px'
        }
      });
    });

    // Create edges
    const newEdges: Edge[] = [];
    
    // Approved edges
    approved.forEach(match => {
      newEdges.push({
        id: `edge-${match.mentorId}-${match.menteeId}`,
        source: `mentor-${match.mentorId}-approved`,
        target: `mentee-${match.menteeId}-approved`,
        animated: true,
        style: { 
          stroke: 'hsl(var(--accent))',
          strokeWidth: 3
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--accent))'
        }
      });
    });

    // Pending edges
    pendingMatches.forEach(match => {
      if (approvedPairs.has(match.mentorId) || approvedPairs.has(match.menteeId)) {
        return;
      }

      const mentorTopMatches = mentorMatches.get(match.mentorId) || [];
      const isMentorTop = mentorTopMatches.some(m => m.menteeId === match.menteeId);

      if (isMentorTop) {
        newEdges.push({
          id: `edge-${match.mentorId}-${match.menteeId}`,
          source: `mentor-${match.mentorId}`,
          target: `mentee-${match.menteeId}`,
          style: { 
            stroke: 'hsl(var(--primary))',
            strokeWidth: 2 + match.normalizedScore * 3
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'hsl(var(--primary))'
          },
          data: { match }
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleEdgeClick = (_: any, edge: Edge) => {
    const match = matches.find(
      m => `edge-${m.mentorId}-${m.menteeId}` === edge.id
    );
    if (match) {
      setSelectedMatch(match);
    }
  };

  const handleApprove = () => {
    if (selectedMatch) {
      updateMatch(selectedMatch.mentorId, selectedMatch.menteeId, 'approved');
      setSelectedMatch(null);
    }
  };

  const handleReject = () => {
    if (selectedMatch) {
      updateMatch(selectedMatch.mentorId, selectedMatch.menteeId, 'rejected');
      setSelectedMatch(null);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/criteria')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Match Visualization</h1>
              <p className="text-sm text-muted-foreground">
                {/* TODO:  Change the number of pending matches to the number of mentors/mentees without a match */}
                {approvedMatches.length} approved • {matches.filter(m => m.status === 'pending').length} pending
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onEdgeClick={handleEdgeClick}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>

        {selectedMatch && (
          //TODO: Add an option to close the window
          <Card className="absolute top-4 right-4 w-96 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Match Details</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm font-medium">Match Score</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent transition-all"
                      style={{ width: `${selectedMatch.normalizedScore * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">
                    {(selectedMatch.normalizedScore * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Matching Factors</p>
                {selectedMatch.reasons.map((reason, index) => (
                  <div key={index} className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{reason.criterion}</span>
                      <span className="font-medium">
                        {((1 - reason.contribution / reason.weight) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-muted-foreground">{reason.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReject}
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={handleApprove}
              >
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
