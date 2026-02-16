import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProfileStore } from '@/stores/useProfileStore'
import { InfoTooltip } from '@/components/shared/InfoTooltip'
import { cn } from '@/lib/utils'

export function PersonalSection() {
  const { currentAge, retirementAge, lifeExpectancy, lifeStage, maritalStatus, setField, validationErrors } =
    useProfileStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Personal Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              Current Age
              <InfoTooltip text="Your current age in years" />
            </Label>
            <Input
              type="number"
              value={currentAge}
              onChange={(e) => setField('currentAge', parseInt(e.target.value) || 0)}
              min={18}
              max={100}
              className={cn('border-blue-300', validationErrors.currentAge && 'border-destructive')}
            />
            {validationErrors.currentAge && (
              <p className="text-xs text-destructive">{validationErrors.currentAge}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              Retirement Age
              <InfoTooltip
                text="The age you plan to stop working and start withdrawing from your portfolio"
              />
            </Label>
            <Input
              type="number"
              value={retirementAge}
              onChange={(e) => setField('retirementAge', parseInt(e.target.value) || 0)}
              min={30}
              max={100}
              className={cn('border-blue-300', validationErrors.retirementAge && 'border-destructive')}
            />
            {validationErrors.retirementAge && (
              <p className="text-xs text-destructive">{validationErrors.retirementAge}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              Life Expectancy
              <InfoTooltip text="The age you plan for your portfolio to last until. Higher is more conservative." />
            </Label>
            <Input
              type="number"
              value={lifeExpectancy}
              onChange={(e) => setField('lifeExpectancy', parseInt(e.target.value) || 0)}
              min={50}
              max={120}
              className={cn('border-blue-300', validationErrors.lifeExpectancy && 'border-destructive')}
            />
            {validationErrors.lifeExpectancy && (
              <p className="text-xs text-destructive">{validationErrors.lifeExpectancy}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-sm flex items-center">
              Life Stage
              <InfoTooltip text="Pre-FIRE: accumulating wealth. Post-FIRE: living off portfolio." />
            </Label>
            <select
              value={lifeStage}
              onChange={(e) => setField('lifeStage', e.target.value as 'pre-fire' | 'post-fire')}
              className="flex h-10 w-full rounded-md border border-blue-300 bg-background px-3 py-2 text-sm"
            >
              <option value="pre-fire">Pre-FIRE (Accumulating)</option>
              <option value="post-fire">Post-FIRE (Withdrawing)</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-sm">Marital Status</Label>
            <select
              value={maritalStatus}
              onChange={(e) => setField('maritalStatus', e.target.value as 'single' | 'married')}
              className="flex h-10 w-full rounded-md border border-blue-300 bg-background px-3 py-2 text-sm"
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
