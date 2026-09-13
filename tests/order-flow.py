"""本地订单链路验收。只对独立测试服务运行，会创建和修改测试数据。
启动：ANCESTOR_DATA_DIR=/tmp/ancestor-integration-data NITRO_PORT=5331 node .output/server/index.mjs
运行：python3 tests/order-flow.py （测试视频路径可用 ANCESTOR_TEST_VIDEO 指定）
"""
import json, os, uuid, urllib.request, urllib.error
from pathlib import Path
BASE = os.environ.get('ANCESTOR_TEST_URL', 'http://127.0.0.1:5331')
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
def call(path, body=None, token=None, method=None, key=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    if key: headers['Idempotency-Key'] = key
    request = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
    try:
        response = opener.open(request, timeout=15)
    except urllib.error.HTTPError as e: response = e
    payload = json.load(response)
    assert response.status == expected, (path, response.status, payload)
    if expected == 200: assert payload['code'] == (0 if token or path == '/api/auth/login' else 200), payload
    return payload.get('data')

def passed(label): print('PASS', label)

token = call('/api/auth/login', {'username': 'vben', 'password': '123456'})['accessToken']
tag = uuid.uuid4().hex[:8]
memorial = dict(customerName='验收'+tag, deceasedName='故人'+tag, memorialDate='2026-10-01', packageName='基础祭祀', packagePrice=168)
call('/api/memorial/orders', {**memorial, 'memorialDate': '2026-02-30'}, expected=400)
call('/api/memorial/orders', {**memorial, 'packagePrice': 1}, expected=400)
call('/api/supplies/products?page=-1', expected=400)
call('/api/memorial-records?customerName=test', expected=400)
passed('日期、价格、分页、姓名查询参数校验')

key = uuid.uuid4().hex
order = call('/api/memorial/orders', memorial, key=key)
assert call('/api/memorial/orders', memorial, key=key)['orderNo'] == order['orderNo']
call('/api/memorial/orders', {**memorial, 'note': '不同内容'}, key=key, expected=409)
number = order['orderNo']; path = '/api/ancestor/ritual-orders/' + number
assert call('/api/orders/' + number)['status'] == 'pending_service'
assert call('/api/ancestor/ritual-orders?status=PENDING_PAYMENT&orderNo='+number, token=token)['total'] == 1
call(path + '/confirm-payment', {}, expected=401)
call(path + '/advance', {}, token=token, expected=409)
assert call(path + '/confirm-payment', {}, token=token)['status'] == 'PAID'
call(path + '/confirm-payment', {}, token=token, expected=409)
assert call('/api/orders/' + number)['status'] == 'paid'
assert call('/api/ancestor/ritual-orders?status=PENDING_PAYMENT&orderNo='+number, token=token)['total'] == 0
assert call('/api/memorial-records?orderNo='+number) == []
passed('祭祀下单、幂等、后台待处理、付款鉴权及同步')

for status in ['PREPARING','PACKAGING','BURNING','PENDING_VIDEO']:
    assert call(path+'/advance', {}, token=token)['status'] == status
    assert call('/api/orders/'+number)['status'] == 'processing'
call(path+'/complete', {}, token=token, expected=409)
# 上传真实MP4并绑定订单。
video = Path(os.environ.get('ANCESTOR_TEST_VIDEO','/tmp/ancestor-test-video.mp4')).read_bytes()
boundary = uuid.uuid4().hex
body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.mp4"\r\nContent-Type: video/mp4\r\n\r\n'.encode()+video+f'\r\n--{boundary}--\r\n'.encode())
request = urllib.request.Request(BASE+'/api/upload/video',data=body,headers={'Authorization':'Bearer '+token,'Content-Type':'multipart/form-data; boundary='+boundary})
response=json.load(opener.open(request,timeout=15));assert response['code']==0,response
url=response['data']['videoUrl']
v=call(path+'/videos', {'stage':'BURNING','videoUrl':url,'availableAt':'2099-01-01 00:00:00'},token=token)
assert call(path+'/complete',{},token=token)['status']=='COMPLETED'
assert call('/api/memorial-records?orderNo='+number)[0]['videos']==[]
call('/api/ancestor/ritual-videos/'+v['id'], {'availableAt':''},token=token,method='PUT')
record=call('/api/memorial-records?orderNo='+number)[0]
assert len(record['videos'])==1
from urllib.parse import urlencode
assert len(call('/api/memorial-records?'+urlencode({'customerName':memorial['customerName'],'deceasedName':memorial['deceasedName']})))==1
assert call('/api/memorial-records?'+urlencode({'customerName':memorial['customerName']+'错','deceasedName':memorial['deceasedName']}))==[]
media=record['videos'][0]['videoUrl']
request=urllib.request.Request(media,headers={'Range':'bytes=0-15'})
with opener.open(request,timeout=15) as res: assert res.status==206 and len(res.read())==16
try: opener.open(BASE+url); raise AssertionError('unsigned media was public')
except urllib.error.HTTPError as e: assert e.code==403
assert len(call(path+'/logs',token=token))==6
call('/api/ancestor/ritual-videos/'+v['id'],token=token,method='DELETE')
assert call('/api/memorial-records?orderNo='+number)[0]['videos']==[]
passed('祭祀全状态流转、MP4上传、完成门槛、日志、精确查询、开放时间、签名播放/拖动、删除同步')

p=call('/api/supplies/products')['items'][0]; stock=p['stock']; spec=p['options'][0]
supplies=dict(productId=p['id'],spec=spec['name'],quantity=2,receiverName='验收'+tag,receiverPhone='13800138000',province='广东省',city='广州市',district='天河区',detailAddress='测试地址')
call('/api/supplies/orders',{**supplies,'receiverPhone':'bad'},expected=400)
sp=call('/api/supplies/orders',supplies,key=uuid.uuid4().hex); spath='/api/ancestor/product-orders/'+sp['orderNo']
assert sp['amount']==round(spec['price']*2,2)
assert call('/api/supplies/products/'+p['id'])['stock']==stock-2
assert call('/api/ancestor/product-orders?status=PENDING_PAYMENT&orderNo='+sp['orderNo'],token=token)['total']==1
call(spath,{'status':'SHIPPED'},token=token,method='PUT',expected=409)
call(spath,{'status':'CANCELLED'},token=token,method='PUT')
assert call('/api/supplies/products/'+p['id'])['stock']==stock
call(spath,{'status':'CANCELLED'},token=token,method='PUT',expected=409)
assert call('/api/supplies/products/'+p['id'])['stock']==stock
sp=call('/api/supplies/orders',supplies); spath='/api/ancestor/product-orders/'+sp['orderNo']
call(spath+'/confirm-payment',{},token=token)
call(spath,{'status':'SHIPPED'},token=token,method='PUT')
assert call('/api/orders/'+sp['orderNo'])['status']=='shipped'
call(spath,{'status':'COMPLETED'},token=token,method='PUT')
assert call(spath,token=token)['status']=='COMPLETED'
passed('用品金额/库存、待处理、取消回补防重复、付款、发货、完成、详情同步')

cat=call('/api/ancestor/categories',{'name':'验收分类'+tag,'code':'flower'},token=token)
prod=call('/api/ancestor/products',{'name':'验收商品'+tag,'categoryId':cat['id'],'price':3.25,'stock':2,'status':1},token=token)
assert call('/api/supplies/products/'+prod['id'])['options'][0]['price']==3.25
call('/api/supplies/orders',{**supplies,'productId':prod['id'],'spec':'标准装','quantity':3},expected=409)
call('/api/ancestor/products/'+prod['id'],{'status':0},token=token,method='PUT')
call('/api/supplies/products/'+prod['id'],expected=404)
call('/api/ancestor/products/'+prod['id'],token=token,method='DELETE')
call('/api/ancestor/categories/'+cat['id'],token=token,method='DELETE')
config=call('/api/ancestor/settings',{'serviceName':'测试客服'+tag,'wechatId':'test'},token=token,method='PUT')
assert call('/api/service-config')['serviceName']==config['serviceName']
assert call('/api/ancestor/dashboard',token=token)['totalRitualOrders']>0
passed('商品分类CRUD/上下架、库存不足、客服同步、实时概览')
Path('/tmp/ancestor-persistence-order.txt').write_text(number)
print('全部接口验收通过；重启持久化检查订单：',number)
