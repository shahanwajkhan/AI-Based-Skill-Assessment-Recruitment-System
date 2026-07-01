from api.models import Assessment
affected = Assessment.objects.filter(title__icontains='interview').update(assessment_type='interview')
print(f'Updated {affected} assessments to type interview.')
