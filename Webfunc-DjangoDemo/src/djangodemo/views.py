from django.shortcuts import render
from django.http import HttpResponse

# Create your views here.

def index(request):
    return render(request, 'index.html', context={'hello': 'world'})

def author(request):
    print(request)
    return HttpResponse("Tencent Cloud Serverless Team")
