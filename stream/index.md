---
title: Streaming simulator
layout: withjs
extrajs:  <script>params = {}; params.get= {}; params.get.res = 5;</script>
          <script src="/static/js/stream/main.js"></script>
---
<section>
    <h2>Streaming simulator</h2>
    <p>
        In fact, it's not really streaming. The sphere is fully
        preloaded and then, a mesh is created and vertices and faces
        are dynamically added to this mesh as time goes by.
    </p>
    <div style="border-width:1px; border-style: solid;" id="container"></div>
</section>
