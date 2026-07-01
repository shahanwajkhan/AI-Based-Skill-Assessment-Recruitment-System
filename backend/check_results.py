import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Result

results = Result.objects.filter(assessment__isnull=True)
print(f"Results with null assessment: {results.count()}")

results_all = Result.objects.all().order_by('-completed_at')[:10]
for r in results_all:
    print(f"Result ID: {r.id}, User: {r.user.username}, Assessment: {r.assessment}, Score: {r.score}")
