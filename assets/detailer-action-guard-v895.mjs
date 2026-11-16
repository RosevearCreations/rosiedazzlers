// Rosie 895: pure client-side guard for a mobile action crossing an async boundary.
// The server remains authoritative for staff session, exact assignment, stage and CAS.
const own = (x,k) => x && Object.prototype.hasOwnProperty.call(x,k);
export function actionSnapshot895(job,action,stage,epoch){
  if(!job || !own(job,'id') || typeof job.id!=='string' ||
     !own(job,'updated_at') || typeof job.updated_at!=='string' ||
     !job.updated_at || typeof action!=='string' || !action ||
     typeof stage!=='string' || !stage || !Number.isSafeInteger(epoch) || epoch<0)return null;
  return Object.freeze({jobId:job.id,revision:job.updated_at,stage,action,epoch});
}
export function actionStillCurrent895(snapshot,job,stage,epoch,{verified=false,allowed=false}={}){
  return Boolean(snapshot && job && verified===true && allowed===true &&
    Number.isSafeInteger(epoch) && epoch===snapshot.epoch &&
    typeof job.id==='string' && job.id===snapshot.jobId &&
    typeof job.updated_at==='string' && job.updated_at===snapshot.revision &&
    typeof stage==='string' && stage===snapshot.stage);
}
export function actionRecoveryMessage895({assignmentGone=false,stageChanged=false,revisionChanged=false}={}){
  if(assignmentGone)return 'The previous job is no longer assigned to this staff account. No action will be repeated. Ask Operations to review it.';
  if(stageChanged)return 'The job stage changed while the connection or action was uncertain. Review the current stage and source evidence before any new action.';
  if(revisionChanged)return 'The job record changed since the attempted action. Review the current job and evidence; no action has been automatically retried.';
  return 'The current assignment was refreshed. An earlier action may have succeeded even if the response was lost; check its source record before sending another.';
}
