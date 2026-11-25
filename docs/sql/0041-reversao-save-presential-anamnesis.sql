-- REVERSÃO da migração 0041 (AP-08 obrigatório no servidor): devolve save_presential_anamnesis ao corpo
-- que estava em produção em 25/11/2026 (lido do banco antes da mudança). Só execute se precisar desfazer.
CREATE OR REPLACE FUNCTION public.save_presential_anamnesis(_version_id uuid, _answers jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE base public.student_anamnesis_versions; nextrow public.student_anamnesis_versions; newid uuid:=gen_random_uuid(); item record; content boolean:=false;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authorized'; END IF;
 SELECT * INTO base FROM public.student_anamnesis_versions WHERE id=_version_id FOR UPDATE;
 IF NOT FOUND OR base.preanamnesis_form_version IS DISTINCT FROM 'v2' THEN RAISE EXCEPTION 'invalid_version'; END IF;
 IF base.tenant_id IS DISTINCT FROM public.get_my_tenant_id() OR NOT(public.is_admin(auth.uid()) OR public.is_supervisor(auth.uid()) OR public.is_coordinator(auth.uid()) OR public.is_teacher(auth.uid())) THEN RAISE EXCEPTION 'not_authorized'; END IF;
 PERFORM public.assert_presential_edit_allowed(base.student_id);
 IF jsonb_typeof(_answers) IS DISTINCT FROM 'object' OR octet_length(_answers::text)>32768 THEN RAISE EXCEPTION 'invalid_answers'; END IF;
 FOR item IN SELECT key,value FROM jsonb_each(_answers) LOOP
  IF item.key !~ '^AP-(01|02|03|04|05|06|08|09)$' AND (item.key !~ '^AP-07:.+$' OR char_length(item.key) NOT BETWEEN 7 AND 1006) THEN RAISE EXCEPTION 'invalid_question'; END IF;
  IF jsonb_typeof(item.value) IS DISTINCT FROM 'string' OR length(item.value#>>'{}')>2000 THEN RAISE EXCEPTION 'invalid_answer'; END IF;
  IF length(btrim(item.value#>>'{}'))>0 THEN content:=true; END IF;
 END LOOP;
 IF NOT content THEN RAISE EXCEPTION 'empty_answers'; END IF;
 nextrow:=base; nextrow.id:=newid; nextrow.created_at:=clock_timestamp(); nextrow.created_by_user_id:=auth.uid(); nextrow.reviewed_from_version_id:=base.id; nextrow.reviewed_at:=clock_timestamp(); nextrow.source:='teacher'; nextrow.ai_summary:=NULL; nextrow.presential_answers:=_answers;
 INSERT INTO public.student_anamnesis_versions SELECT (nextrow).*;
 INSERT INTO public.student_conditions(tenant_id,student_id,anamnesis_version_id,condition_option_id,notes) SELECT tenant_id,student_id,newid,condition_option_id,notes FROM public.student_conditions WHERE anamnesis_version_id=base.id;
 INSERT INTO public.student_goals(tenant_id,student_id,anamnesis_version_id,goal_option_id,priority) SELECT tenant_id,student_id,newid,goal_option_id,priority FROM public.student_goals WHERE anamnesis_version_id=base.id;
 INSERT INTO public.student_restrictions(tenant_id,student_id,anamnesis_version_id,restriction_option_id,notes) SELECT tenant_id,student_id,newid,restriction_option_id,notes FROM public.student_restrictions WHERE anamnesis_version_id=base.id;
 INSERT INTO public.student_injuries(tenant_id,student_id,anamnesis_version_id,region,notes,is_active,limitations) SELECT tenant_id,student_id,newid,region,notes,is_active,limitations FROM public.student_injuries WHERE anamnesis_version_id=base.id;
 INSERT INTO public.student_surgeries(tenant_id,student_id,anamnesis_version_id,description,approx_date,notes) SELECT tenant_id,student_id,newid,description,approx_date,notes FROM public.student_surgeries WHERE anamnesis_version_id=base.id;
 INSERT INTO public.student_medications(tenant_id,student_id,anamnesis_version_id,description,notes) SELECT tenant_id,student_id,newid,description,notes FROM public.student_medications WHERE anamnesis_version_id=base.id;
 RETURN newid;
END $function$;
