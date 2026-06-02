#!/usr/bin/env python3
"""
API-Market 一体化采集、清洗、分类、评分脚本
整合所有步骤为一个可执行的流水线
"""
import json
import os
import re
import time
from collections import defaultdict

# ========== 配置 ==========
OUTPUT_DIR = '/workspace/API-Market'
DB_PATH = os.path.join(OUTPUT_DIR, 'api-database.json')
INDEX_PATH = os.path.join(OUTPUT_DIR, 'search-index.json')
APIS_DIR = os.path.join(OUTPUT_DIR, 'apis')

# 分类规则（关键词 -> 分类）
KEYWORD_RULES = [
    (['bitcoin','ethereum','crypto','defi','nft','token','web3','solana','coin','wallet','dex','swap','mining','blockchain','smart contract','solidity','dapp','decentralized','etherscan','covalent','alchemy','infura','moralis','thegraph'], 'cryptocurrency'),
    (['stock','trading','market data','investment','portfolio','fund','dividend','fintech','banking','insurance','loan','mortgage','credit','accounting','tax','invoice','receipt','financial','plaid'], 'finance'),
    (['payment','checkout','stripe','paypal','braintree','billing','subscription','merchant','transaction','pos','adyen','paymill','mercadopago','razorpay','klarna','wise','skrill','mangopay','afterbanks'], 'payment'),
    (['exchange rate','currency','forex','conversion','fiat','fixer','currencylayer'], 'currency'),
    (['geocod','map','location','gps','coordinate','latitude','longitude','address','zip code','postal','route','direction','distance','gis','satellite','terrain','boundary','region','place','geocoding','mapbox','tomtom','here.com','openstreetmap','navigation','fleet','vehicle','car','automotive','driving','traffic','parking','fuel','ev','vin','nhtsa','dmv','license plate','motorcycle','deutsche bahn','train','railway','bus','flight','airline','airport','aviation','ship','marine','amadeus','kiwi','skyscanner','transport','shipping','delivery','parcel','logistics','aftership','17track','usps','fedex','ups','dhl','mercedes','tesla','transportation','travel'], 'transportation'),
    (['weather','forecast','temperature','humidity','rain','snow','wind','climate','meteorolog','atmosphere','uv','air quality','pollution','openweathermap','weatherapi','weatherbit','accuweather','stormglass'], 'weather'),
    (['government','gov','parliament','congress','senate','legislation','law','regulation','police','court','election','voter','census','demographic','bureau','uspto','patent','trademark','copyright','intellectual property','fbi','cia','nasa','space','isro','esa','noaa','usgs'], 'government'),
    (['news','article','headline','journal','press','media','rss','feed','blog','nytimes','guardian','reuters','bbc','npr','newspaper','journalism','magazine','publishing'], 'news'),
    (['music','song','artist','album','track','playlist','spotify','lyric','audio','podcast','radio','sound','acoust','itunes','deezer','soundcloud','genius','musixmatch','last.fm','streaming','broadcast','tv','channel','video','youtube','vimeo','dailymotion','twitch','netflix','hulu','disney','film','movie'], 'entertainment'),
    (['game','gaming','minecraft','steam','esport','roblox','playstation','xbox','nintendo','chess','puzzle','rpg','mmorpg','igdb','rawg','riot','blizzard','mojang','epicgames','comics','manga','anime','otaku','cosplay','anilist','myanimelist','kitsu','jikan','mangadex','ghibli'], 'games-comics'),
    (['social','twitter','facebook','instagram','linkedin','reddit','discord','slack','telegram','whatsapp','messenger','tiktok','weibo','wechat','follower','mastodon','pinterest','tumblr','messaging','chat','collaboration','team','project management','trello','asana','jira','notion','wiki','kanban','agile','scrum','microsoft teams','zoom','meeting','calendar','event','schedule','reminder','holiday','date','time','timezone','calendly','eventbrite','meetup','ticketmaster'], 'social'),
    (['email','mail','smtp','imap','inbox','newsletter','mailbox','spam','mailgun','sendgrid','ses','sparkpost','postmark','gmail','outlook','mailchimp','marketing','campaign'], 'email'),
    (['cloud storage','file storage','dropbox','google drive','onedrive','s3','bucket','upload','cdn','hosting','server','azure','aws','digitalocean','heroku','vercel','netlify','cloudflare','oracle','ibm','firebase','supabase','appwrite','box','gofile','filestack','pinata','storj','googleapis','cloud','saas','erp','crm','enterprise','b2b','hubspot','salesforce','sap','oracle','zoho','freshdesk','service','zendesk','ticket','support','helpdesk'], 'cloud-storage'),
    (['shop','store','product','price','cart','order','ecommerce','e-commerce','amazon','ebay','etsy','retail','coupon','deal','marketplace','catalog','inventory','barcode','sku','shopify','woocommerce','magento','bigcommerce','walmart','priceline','booking','airbnb','vtex','commerce'], 'shopping'),
    (['food','recipe','restaurant','nutrition','calorie','meal','drink','beer','wine','cocktail','yelp','ubereats','doordash','opentable','spoonacular','edamam','punkapi'], 'food-drink'),
    (['health','medical','doctor','hospital','disease','symptom','drug','medicine','pharmacy','fitness','exercise','workout','covid','vaccine','mental health','therapy','diagnosis','patient','clinical','who','cdc','fda','openfda','fitbit','strava','nike','sports','football','soccer','basketball','baseball','tennis','cricket','nfl','nba','fifa','olympic','score','league','team','athlete','gym','yoga','espn'], 'health'),
    (['book','library','isbn','author','publish','reading','literature','ebook','audiobook','bible','quran','poetry','goodreads','gutendex','worldcat','education','learn','course','university','school','student','teacher','grade','quiz','exam','tutor','khan','coursera','udemy','edx','quizlet','duolingo','language','translat','localiz','i18n','l10n','dictionary','spell','grammar','linguist','deepl','libretranslate','mymemory','define','synonym','antonym','rhyme','pronunciation','etymology','thesaurus'], 'books'),
    (['security','firewall','vpn','ssl','tls','encryption','malware','virus','phishing','auth','2fa','mfa','password','credential','identity','sso','oauth','jwt','pentest','vulnerability','cve','auth0','okta','onelogin','duo','sucuri','virustotal','abuseipdb','haveibeenpwned','anchore','container','devsecops','compliance','audit','threat','incident','forensic','cybersecurity'], 'security'),
    (['api','sdk','framework','library','docker','kubernetes','ci/cd','github','gitlab','jenkins','deploy','build','test','debug','log','monitor','webhook','graphql','rest','swagger','openapi','endpoint','microservice','serverless','function','lambda','npm','pip','maven','code','compile','ide','linter','formatter','screenshot','pdf','html','css','javascript','python','golang','rust','java','php','ruby','sentry','datadog','newrelic','grafana','prometheus','elastic','jira','confluence','notion','postman','firebase','supabase','appwrite','bitbucket','circleci','travis','vercel','netlify','heroku','continuous','integration','delivery','deployment','pipeline','devops','infrastructure','terraform','ansible','monitoring','alert','observability','mixpanel','amplitude','segment','heap','hotjar','analytics','metric','dashboard','chart','graph','statistics','report','insight','telemetry','performance','uptime','open source','repository','contribution','license','changelog','release','npmjs','pypi','crates','packagist','rubygems','developer','tool','utility','helper','wrapper','client','airbyte','etl','connector','sync','replicate','migrate','import','export','akeneo','pim','cms','content','wordpress','drupal'], 'development'),
    (['iot','sensor','device','smart home','arduino','raspberry','mqtt','zigbee','bluetooth','thermostat','automation','particle','thingspeak','adafruit','homeassistant','smartthings','opto22','industrial','manufacturing','machine','equipment','scada','plc','hmi'], 'iot'),
    (['joke','funny','meme','gif','emoji','trivia','quote','random','fun','comedy','horoscope','tarot','chuck norris','personality','mbti','enneagram','astrology','zodiac','numerology','psychology','profile'], 'entertainment'),
    (['animal','pet','dog','cat','bird','fish','horse','wildlife','zoo','shelter','adopt','breed','petfinder','adoptapet','shibe','axolotl'], 'animals'),
    (['photo','image','picture','camera','thumbnail','screenshot','icon','logo','avatar','svg','illustration','drawing','pixabay','unsplash','pexels','flickr','imgur','giphy','placeholder','robohash','pravatar','loremflickr','placekitten','placedog','metmuseum','artic','rijksmuseum','harvardart','cooperhewitt','europeana','colormind','colourlovers','dribbble','art','design','color','font','typography','ui','ux','wireframe','mockup','figma','canva','creative','visual'], 'photography'),
    (['job','career','employ','resume','cv','recruit','hiring','salary','freelance','gig','internship','indeed','glassdoor','ziprecruiter','reed','jooble','adzuna','careerjet','hr','human resource','payroll','employee','workforce'], 'jobs'),
    (['phone','sms','call','telecom','mobile','carrier','number','dial','voip','whatsapp','mms','twilio','messagebird','vonage','nexmo','plivo','sinch','bandwidth','numverify','telnyx','mcc','mnc','imsi','sim','network operator','cell tower','telecommunication','hsbc','xero'], 'phone'),
    (['url short','bit.ly','tinyurl','redirect','link short','rebrandly','cutt.ly','domain','dns','whois','ssl','certificate'], 'url-shorteners'),
    (['document','pdf','word','excel','spreadsheet','powerpoint','slide','form','signature','contract','scan','ocr','adobe','docu','convert','parser','extractor'], 'documents'),
    (['fake','mock','test data','dummy','placeholder','sample','fixture','random data','faker','jsonplaceholder','reqres','httpbin'], 'test-data'),
    (['track','package','shipment','delivery','courier','parcel','aftership','17track','usps','fedex','ups','dhl'], 'tracking'),
    (['environment','carbon','emission','sustainability','green','energy','solar','renewable','ecology','wildfire','earthquake','tsunami','volcano','aqicn','openaq'], 'environment'),
    (['ai ','artificial intelligence','machine learning','deep learning','neural','gpt','llm','chatbot','nlp','sentiment','image recognition','object detection','speech','voice','ocr','computer vision','recommendation','tensorflow','pytorch','hugging face','openai','anthropic','gemini','claude','mistral','embedding','vector','rag','langchain','inference','training','annotation','seldon','ml','model','predict','classify','detection','recognition','text analysis','entity','keyword','parse','extract','summariz','plagiarism','meaningcloud','aylien','monkeylearn'], 'machine-learning'),
    (['science','math','physics','chemistry','biology','astronomy','space','genome','protein','molecule','atom','equation','calculator','conversion','unit','open data','dataset','data portal','data gov','census','statistics','indicator','world bank','united nations','oecd','eurostat','datahub','codat','financial data','business data','company data'], 'open-data'),
    (['data validation','verify','check','format','schema','lint','sanitize','smarty','vat','address','email validation','phone validation','interzoid','deduplication','matching','cleansing','quality','standardize','normalize','transform','etl','pipeline'], 'data-validation'),
    (['authentication','authorization','login','signup','sso','saml','ldap','oauth','identity','mfa','2fa','biometric','auth0','okta','cognito','clerk','stytch','warrant','arespass','passkey'], 'auth'),
    (['agriculture','farming','crop','seed','harvest','soil','irrigation','agco','caterpillar','construction','building','architecture','real estate','property','rental'], 'other'),
    (['telecom','carrier','mno','mcc','mnc','imsi','sim','network operator','cell tower','communication','wholesale','retail','telecommunication'], 'telecom'),
    (['media','streaming','broadcast','podcast','radio','tv','channel','content','publishing','distribution','monetization','advertising','ad','creative'], 'media'),
    (['collaboration','team','project management','trello','asana','jira','notion','wiki','kanban','agile','scrum','microsoft teams','zoom','meeting','video conferencing','webinar','presentation','screen share'], 'collaboration'),
    (['calendar','event','schedule','meeting','reminder','holiday','date','time','timezone','calendly','eventbrite','meetup','ticketmaster','billetto','humanitix','onsched','appointment','booking','reservation'], 'calendar'),
    (['vehicle','car','auto','motorcycle','vin','license plate','dmv','nhtsa','fuel','ev','electric','charging','station','fleet','telematics','obd','diagnostic'], 'vehicle'),
    (['anime','manga','otaku','cosplay','anilist','myanimelist','kitsu','jikan','mangadex','ghibli'], 'anime'),
    (['anti-malware','antivirus','phishing','threat','abuse','blacklist','whitelist','quarantine','urlhaus','alienvault','otx','ioc','indicator','compromise'], 'anti-malware'),
    (['ci','cd','continuous','integration','delivery','deployment','pipeline','jenkins','travis','circleci','github actions','gitlab ci','drone','semaphore','buildkite','appveyor','codebuild','codepipeline','release','publish','distribute'], 'ci'),
    (['science','math','physics','chemistry','biology','astronomy','space','nasa','genome','protein','molecule','atom','equation','calculator','conversion','unit','isro','esa','noaa','usgs','research','laboratory','experiment'], 'science-math'),
    (['programming','code','algorithm','data structure','leetcode','hackerrank','compiler','interpreter','ide','snippet','replit','judge0','jdoodle','code execution','sandbox','playground'], 'programming'),
    (['open source','github','gitlab','repository','contribution','license','changelog','release','npmjs','pypi','crates','packagist','rubygems'], 'open-source'),
    (['events','conference','meetup','ticket','booking','registration','rsvp','seminar','workshop','webinar'], 'events'),
    (['patent','trademark','copyright','intellectual property','uspto','ipo','legal','compliance','regulatory'], 'patent'),
    (['text analysis','nlp','sentiment','entity','keyword','parse','extract','summariz','plagiarism','meaningcloud','aylien','monkeylearn','text','corpus','language processing'], 'text-analysis'),
]

CATEGORY_DISPLAY_NAMES = {
    'animals': 'Animals', 'anime': 'Anime', 'anti-malware': 'Anti-Malware',
    'art-design': 'Art & Design', 'auth': 'Authentication & Authorization',
    'blockchain': 'Blockchain', 'books': 'Books', 'business': 'Business',
    'calendar': 'Calendar', 'cloud-storage': 'Cloud Storage & File Sharing',
    'ci': 'Continuous Integration', 'cryptocurrency': 'Cryptocurrency',
    'currency': 'Currency Exchange', 'data-validation': 'Data Validation',
    'development': 'Development', 'dictionaries': 'Dictionaries',
    'documents': 'Documents & Productivity', 'email': 'Email',
    'entertainment': 'Entertainment', 'environment': 'Environment',
    'events': 'Events', 'finance': 'Finance', 'food-drink': 'Food & Drink',
    'games-comics': 'Games & Comics', 'geocoding': 'Geocoding',
    'government': 'Government', 'health': 'Health', 'jobs': 'Jobs',
    'machine-learning': 'Machine Learning & AI', 'music': 'Music',
    'news': 'News & Media', 'open-data': 'Open Data',
    'open-source': 'Open Source Projects', 'patent': 'Patent',
    'personality': 'Personality', 'phone': 'Phone & Telecom',
    'photography': 'Photography & Images', 'programming': 'Programming',
    'science-math': 'Science & Math', 'security': 'Security',
    'shopping': 'Shopping & E-commerce', 'social': 'Social & Messaging',
    'sports-fitness': 'Sports & Fitness', 'test-data': 'Test Data',
    'text-analysis': 'Text Analysis & NLP', 'tracking': 'Tracking',
    'transportation': 'Transportation & Travel', 'url-shorteners': 'URL Shorteners',
    'vehicle': 'Vehicle', 'video': 'Video', 'weather': 'Weather',
    'analytics': 'Analytics & Metrics', 'payment': 'Payment & Billing',
    'iot': 'IoT (Internet of Things)', 'collaboration': 'Collaboration',
    'media': 'Media', 'telecom': 'Telecom', 'education': 'Education',
    'other': 'Other',
}


def classify_api(name, description):
    text = f"{name} {description}".lower()
    best_match = None
    best_score = 0
    for keywords, category in KEYWORD_RULES:
        score = sum(len(k) for k in keywords if k.lower() in text)
        if score > best_score:
            best_score = score
            best_match = category
    return best_match or 'other'


def infer_auth(name, description, url):
    text = f"{name} {description}".lower()
    no_auth = ['no auth', 'no authentication', 'without auth', 'free', 'open', 'public', 'unauthenticated']
    if any(p in text for p in no_auth):
        return None
    auth_map = {
        'apiKey': ['api key', 'apikey', 'api-key', 'token', 'access token', 'bearer', 'x-api-key'],
        'OAuth': ['oauth', 'authorization code'],
        'Basic': ['basic auth', 'username password'],
    }
    for at, patterns in auth_map.items():
        if any(p in text for p in patterns):
            return at
    known = {'stripe':'apiKey','twilio':'apiKey','sendgrid':'apiKey','openai':'apiKey','anthropic':'apiKey','googleapis':'apiKey','github':'OAuth','twitter':'OAuth'}
    for svc, auth in known.items():
        if svc in url.lower():
            return auth
    return None


def calculate_quality(api):
    score = 0
    desc = api.get('description', '')
    if desc:
        score += min(25, len(desc) // 4 + 10)
    if api.get('auth') is not None: score += 10
    if api.get('https') is not None: score += 10
    if api.get('cors') is not None: score += 10
    url = api.get('url', '')
    if url:
        score += 20 if url.startswith('https://') else 10
        if any(x in url.lower() for x in ['/docs','/api','swagger','openapi']): score += 5
    if api.get('category') and api['category'] != 'other': score += 15
    elif api.get('category') == 'other': score += 5
    source = api.get('source', '')
    if isinstance(source, list): score += 10
    elif source in ['apis.guru', 'github']: score += 8
    elif source: score += 5
    grade = 'A' if score >= 85 else 'B' if score >= 70 else 'C' if score >= 55 else 'D' if score >= 40 else 'F'
    return score, grade


# ========== Step 1: 采集APIs.guru ==========
def collect_apis_guru():
    print("\n📡 [1/4] 采集 APIs.guru...")
    try:
        import urllib.request
        url = 'https://api.apis.guru/v2/list.json'
        req = urllib.request.Request(url, headers={'User-Agent': 'API-Market/2.0'})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))

        apis = []
        for name, info in data.items():
            versions = info.get('versions', {})
            if not versions: continue
            latest = sorted(versions.keys(), reverse=True)[0]
            ver = versions[latest]
            vi = ver.get('info', {})
            apis.append({
                'name': vi.get('title', name),
                'url': ver.get('swaggerUrl', ''),
                'description': (vi.get('description', '') or '')[:200],
                'source': 'apis.guru',
            })
        print(f"  ✅ {len(apis)} APIs from APIs.guru")
        return apis
    except Exception as e:
        print(f"  ❌ APIs.guru 采集失败: {e}")
        return []


# ========== Step 2: 采集GitHub ==========
def collect_github(token=None):
    print("\n📡 [2/4] 采集 GitHub awesome-api 仓库...")
    repos = [
        'public-apis/public-apis',
        'marcelscruz/public-apis',
        'toddmotto/public-apis',
        'public-api-lists/public-api-lists',
        'n0shake/Public-APIs',
        'keploy/public-apis-collection',
    ]

    all_apis = []
    headers = {'Authorization': f'token {token}'} if token else {}

    for repo in repos:
        try:
            import urllib.request
            url = f'https://api.github.com/repos/{repo}/readme'
            req = urllib.request.Request(url, headers={**headers, 'Accept': 'application/vnd.github.v3.raw'})
            with urllib.request.urlopen(req, timeout=15) as resp:
                content = resp.read().decode('utf-8', errors='ignore')

            apis = []
            for line in content.split('\n'):
                if line.startswith('| [') and not line.startswith('| ---'):
                    parts = [p.strip() for p in line.split('|')]
                    if len(parts) >= 5:
                        name_match = re.search(r'\[(.*?)\]\((.*?)\)', parts[1])
                        if name_match:
                            apis.append({
                                'name': name_match.group(1),
                                'url': name_match.group(2),
                                'description': parts[2].strip()[:200],
                                'auth': parts[3].strip() if parts[3].strip() != 'No' else None,
                                'https': parts[4].strip() == 'Yes',
                                'cors': parts[5].strip() == 'Yes' if len(parts) > 5 else None,
                                'source': repo,
                            })
            all_apis.extend(apis)
            print(f"  ✅ {repo}: {len(apis)} APIs")
        except Exception as e:
            print(f"  ⚠️ {repo}: {e}")

    # 去重
    seen = set()
    unique = []
    for api in all_apis:
        key = (api['name'].lower(), api['url'].lower())
        if key not in seen:
            seen.add(key)
            unique.append(api)

    print(f"  ✅ GitHub总计: {len(unique)} APIs (去重后)")
    return unique


# ========== Step 3: 合并去重分类 ==========
def merge_and_classify(guru_apis, github_apis):
    print("\n🔄 [3/4] 合并、去重、分类...")

    all_apis = []

    # 标准化apis.guru数据
    for api in guru_apis:
        api['auth'] = infer_auth(api['name'], api.get('description', ''), api.get('url', ''))
        api['https'] = True if api.get('url', '').startswith('https') else None
        api['cors'] = None
        api['category'] = classify_api(api['name'], api.get('description', ''))
        api['tags'] = [api['category']]
        api['status'] = 'active'
        all_apis.append(api)

    # 标准化github数据
    for api in github_apis:
        api['category'] = classify_api(api['name'], api.get('description', ''))
        api['tags'] = [api['category']]
        api['status'] = 'active'
        all_apis.append(api)

    # 去重
    seen = {}
    for api in sorted(all_apis, key=lambda x: 4 if x.get('source') == 'apis.guru' else 1, reverse=True):
        key = (api['name'].lower().strip(), api.get('url', '').lower().rstrip('/'))
        if not key[0] or not key[1]: continue
        if key in seen:
            existing = seen[key]
            if not existing.get('description') and api.get('description'):
                existing['description'] = api['description']
            if not existing.get('auth') and api.get('auth'):
                existing['auth'] = api['auth']
            if existing.get('https') is None and api.get('https') is not None:
                existing['https'] = api['https']
            if existing.get('cors') is None and api.get('cors') is not None:
                existing['cors'] = api['cors']
        else:
            seen[key] = api.copy()

    unique = list(seen.values())
    print(f"  合并: {len(all_apis)} → 去重: {len(unique)}")
    return unique


# ========== Step 4: 质量评分 + 生成输出 ==========
def build_output(apis):
    print("\n📊 [4/4] 质量评分 + 生成输出...")

    # 质量评分
    for api in apis:
        score, grade = calculate_quality(api)
        api['quality_score'] = score
        api['quality_grade'] = grade
        api['quality'] = {'score': score, 'grade': grade}

    # 按分类分组
    cats = defaultdict(list)
    for api in apis:
        cat = api.get('category', 'other')
        safe_name = re.sub(r'[^a-z0-9]', '_', api['name'].lower().strip())[:40]
        api['id'] = f"{cat.replace('-','_')}_{safe_name}"
        cats[cat].append(api)

    categories = []
    for cid, capis in sorted(cats.items(), key=lambda x: -len(x[1])):
        categories.append({
            'id': cid,
            'name': CATEGORY_DISPLAY_NAMES.get(cid, cid.replace('-',' ').title()),
            'display_name': CATEGORY_DISPLAY_NAMES.get(cid, cid.replace('-',' ').title()),
            'api_count': len(capis),
            'apis': capis,
        })

    database = {
        'metadata': {
            'name': 'API-Market',
            'version': '2.1.0',
            'description': '全网规模化公开API集合 - 多源聚合、智能分类、质量评分',
            'total_apis': len(apis),
            'total_categories': len(categories),
            'sources': ['apis.guru', 'github-awesome-apis'],
            'last_updated': time.strftime('%Y-%m-%d'),
            'quality_enhanced': True,
        },
        'categories': categories,
    }

    # 搜索索引（加权）
    search_index = []
    for cat in categories:
        for api in cat['apis']:
            name = api.get('name', '')
            desc = api.get('description', '')
            cat_name = cat['name']
            tags = ' '.join(api.get('tags', []))
            weighted = f"{name} {name} {name} {cat_name} {cat_name} {tags} {tags} {desc}"
            search_index.append({
                'id': api['id'], 'name': name, 'description': desc,
                'category': cat_name, 'category_id': cat['id'],
                'tags': api.get('tags', []), 'source': api.get('source', ''),
                'quality_grade': api.get('quality_grade', 'N/A'),
                'quality_score': api.get('quality_score', 0),
                '_search_text': weighted.lower(),
            })

    # 保存
    os.makedirs(APIS_DIR, exist_ok=True)

    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(database, f, indent=2, ensure_ascii=False)

    with open(INDEX_PATH, 'w', encoding='utf-8') as f:
        json.dump(search_index, f, indent=2, ensure_ascii=False)

    for cat in categories:
        with open(os.path.join(APIS_DIR, f"{cat['id']}.json"), 'w', encoding='utf-8') as f:
            json.dump(cat, f, indent=2, ensure_ascii=False)

    # 统计
    grade_dist = defaultdict(int)
    for api in apis:
        grade_dist[api['quality_grade']] += 1

    other_count = next((c['api_count'] for c in categories if c['id'] == 'other'), 0)
    has_desc = sum(1 for a in apis if a.get('description') and len(a['description']) > 5)

    print(f"  ✅ API总数: {len(apis)}")
    print(f"  ✅ 分类数: {len(categories)}")
    print(f"  ✅ 描述覆盖率: {has_desc}/{len(apis)} ({has_desc/len(apis)*100:.1f}%)")
    print(f"  ✅ Other剩余: {other_count}")
    print(f"  ✅ 质量分布: A={grade_dist.get('A',0)} B={grade_dist.get('B',0)} C={grade_dist.get('C',0)} D={grade_dist.get('D',0)} F={grade_dist.get('F',0)}")


def main():
    token = os.environ.get('GITHUB_TOKEN', '')

    print("=" * 60)
    print("  API-Market 一体化采集流水线")
    print("=" * 60)

    guru = collect_apis_guru()
    github = collect_github(token)
    apis = merge_and_classify(guru, github)
    build_output(apis)

    print("\n" + "=" * 60)
    print("  ✨ 流水线执行完成！")
    print("=" * 60)


if __name__ == '__main__':
    main()
