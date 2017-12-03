import { run } from '@ember/runloop';
import Route from '@ember/routing/route';
import { inject as service } from '@ember/service';

export default Route.extend({

    ajax: service(),

    async activate() {
        await this.get('ajax').delete(`/logout`);
        run(() => {
            this.session.logoutUser();
            this.transitionTo('index');
        });
    }
});
