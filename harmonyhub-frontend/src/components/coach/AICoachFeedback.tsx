import { useQuery } from "@tanstack/react-query";
import { aiCoachService } from "@/api/services/aiCoachService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Sparkles, TrendingUp, Target, ArrowRight } from "lucide-react";

export const AICoachFeedback: React.FC = () => {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ["ai-coach-feedback"],
    queryFn: () => aiCoachService.getFeedback(),
  });

  if (isLoading) return <Spinner />;
  if (!feedback) return null;

  return (
    <Card className="space-y-6">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-6 h-6 text-brass-gold-500" />
        <h2 className="text-xl font-display text-loft-plum-900">AI Coach</h2>
      </div>

      <div className="bg-loft-plum-50 rounded-lg p-4">
        <p className="text-loft-plum-700">{feedback.encouragement}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium text-choir-sage-600 mb-2 flex items-center">
            <TrendingUp className="w-4 h-4 mr-1" />
            Strengths
          </h3>
          <ul className="space-y-1">
            {feedback.strengths?.map((strength, i) => (
              <li key={i} className="text-sm text-loft-plum-600">
                • {strength}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-medium text-ember-coral-600 mb-2 flex items-center">
            <Target className="w-4 h-4 mr-1" />
            Areas to Improve
          </h3>
          <ul className="space-y-1">
            {feedback.areas_to_improve?.map((area, i) => (
              <li key={i} className="text-sm text-loft-plum-600">
                • {area}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="font-medium text-loft-plum-700 mb-2">Suggestions</h3>
        <ul className="space-y-2">
          {feedback.suggestions?.map((suggestion, i) => (
            <li key={i} className="text-sm text-loft-plum-600 flex items-start">
              <ArrowRight className="w-4 h-4 mr-2 mt-0.5 text-brass-gold-500" />
              {suggestion}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-medium text-loft-plum-700 mb-2">Next Steps</h3>
        <div className="flex flex-wrap gap-2">
          {feedback.next_steps?.map((step, i) => (
            <Badge key={i} variant="plum">
              {step}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  );
};
